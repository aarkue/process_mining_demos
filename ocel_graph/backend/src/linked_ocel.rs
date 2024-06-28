use std::{
  collections::{HashMap, HashSet},
  fmt::Display,
};

use itertools::Itertools;
use process_mining::{
  event_log::ocel::ocel_struct::{OCELEvent, OCELObject, OCELRelationship}, ocel::ocel_struct::OCELType, OCEL
};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub type QualifierAndObjectType = (String, String);

pub fn get_object_events_map(
  ocel: &OCEL,
  object_map: &HashMap<String, ObjectIndex>,
) -> HashMap<ObjectIndex, Vec<EventIndex>> {
  let mut object_events_map: HashMap<ObjectIndex, Vec<EventIndex>> = ocel
      .objects
      .iter()
      .enumerate()
      .map(|(index, _)| (ObjectIndex(index), Vec::new()))
      .collect();

  for (e_index, e) in ocel.events.iter().enumerate() {
      let rels = get_event_relationships(e);
      for r in rels {
          match object_map
              .get(&r.object_id)
              .and_then(|ob_index| object_events_map.get_mut(ob_index))
          {
              Some(o_evs) => o_evs.push(EventIndex(e_index)),
              None => {
                  eprintln!("Malformed OCEL: Event {} relates to object ID {}, which does not belong to any object.",e.id,r.object_id)
              }
          }
      }
  }
  object_events_map
}

pub fn get_events_of_type_associated_with_objects(
  linked_ocel: &IndexLinkedOCEL,
  event_types: &HashSet<std::string::String>,
  object_indices: &[ObjectIndex],
) -> Vec<EventIndex> {
  if object_indices.is_empty() {
      return linked_ocel
          .ocel
          .events
          .iter()
          .enumerate()
          .filter(|(_e_index, e)| event_types.contains(&e.event_type))
          .map(|(e_index, _)| EventIndex(e_index))
          .collect();
  }
  let mut sorted_object_ids_iter = object_indices.iter().sorted_by(|a, b| {
      linked_ocel
          .object_events_map
          .get(*a)
          .unwrap()
          .len()
          .cmp(&linked_ocel.object_events_map.get(*b).unwrap().len())
  });

  let mut intersection: HashSet<EventIndex> = linked_ocel
      .object_events_map
      .get(sorted_object_ids_iter.next().unwrap())
      .unwrap()
      .iter()
      .filter(|e_index| {
          event_types.contains(&linked_ocel.ev_by_index(e_index).unwrap().event_type)
      })
      .copied()
      .collect();
  for other in sorted_object_ids_iter {
      let other_map: HashSet<EventIndex> = linked_ocel
          .object_events_map
          .get(other)
          .unwrap()
          .iter()
          .copied()
          .collect();
      intersection.retain(|ev| other_map.contains(ev))
  }
  intersection.into_iter().collect()
}

pub fn get_event_relationships(ev: &OCELEvent) -> Vec<OCELRelationship> {
  match &ev.relationships {
      Some(rels) => rels.clone(),
      None => Vec::default(),
  }
}

pub fn get_object_relationships(obj: &OCELObject) -> Vec<OCELRelationship> {
  match &obj.relationships {
      Some(rels) => rels.clone(),
      None => Vec::new(),
  }
}

///
/// Computes [HashMap] linking an object type to the [HashSet] of [QualifierAndObjectType] that objects of that type are linked to (through O2O Relationships)
pub fn get_object_rels_per_type(
  ocel: &OCEL,
  object_map: &HashMap<String, &OCELObject>,
) -> HashMap<String, HashSet<QualifierAndObjectType>> {
  let mut object_to_object_rels_per_type: HashMap<String, HashSet<QualifierAndObjectType>> = ocel
      .object_types
      .iter()
      .map(|t| (t.name.clone(), HashSet::new()))
      .collect();
  for o in &ocel.objects {
      let rels_for_type = object_to_object_rels_per_type
          .get_mut(&o.object_type)
          .unwrap();
      for rels in get_object_relationships(o) {
          match object_map.get(&rels.object_id) {
              Some(rel_obj) => {
                  rels_for_type.insert((rels.qualifier, rel_obj.object_type.clone()));
              }
              None => {
                  eprintln!("Malformed OCEL: Object {} has relationship to object ID {}, which does not belong to any object",o.id, rels.object_id);
              }
          }
      }
  }
  object_to_object_rels_per_type
}

#[derive(TS)]
#[ts(export, export_to = "../../../frontend/src/types/generated/")]
#[derive(Debug, Clone, Copy, Hash, Serialize, Deserialize, PartialEq, Eq)]
pub struct EventIndex(pub usize);

impl Display for EventIndex {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
      write!(f, "Ev:{}", self.0)
  }
}

#[derive(TS)]
#[ts(export, export_to = "../../../frontend/src/types/generated/")]
#[derive(Debug, Clone, Copy, Hash, Serialize, Deserialize, PartialEq, Eq)]
pub struct ObjectIndex(pub usize);
impl Display for ObjectIndex {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
      write!(f, "Ob:{}", self.0)
  }
}

#[derive(Debug, Hash, PartialEq, Eq, Clone, Copy)]
pub enum ObjectOrEventIndex {
  Object(ObjectIndex),
  Event(EventIndex),
}

#[derive(Serialize, Deserialize)]
#[serde(untagged)]
pub enum OCELNode {
  Event(OCELEvent),
  Object(OCELObject),
}

impl OCELNode {
  pub fn get_id(&self) -> &String {
      match &self {
          OCELNode::Event(ev) => &ev.id,
          OCELNode::Object(ob) => &ob.id,
      }
  }
}

pub enum OCELNodeRef<'a> {
  Event(&'a OCELEvent),
  Object(&'a OCELObject),
}
impl<'a> OCELNodeRef<'a> {
  pub fn cloned(self) -> OCELNode {
      match self {
          OCELNodeRef::Event(ev) => OCELNode::Event(ev.clone()),
          OCELNodeRef::Object(ob) => OCELNode::Object(ob.clone()),
      }
  }
}

#[derive(Debug, Clone)]
pub struct IndexLinkedOCEL {
  pub object_events_map: HashMap<ObjectIndex, Vec<EventIndex>>,
  pub object_rels_per_type: HashMap<String, HashSet<QualifierAndObjectType>>,

  pub events_of_type: HashMap<String, Vec<EventIndex>>,
  pub objects_of_type: HashMap<String, Vec<ObjectIndex>>,
  pub ocel: OCEL,
  pub event_index_map: HashMap<String, EventIndex>,
  pub object_index_map: HashMap<String, ObjectIndex>,

  // Relations between Objects and Objects/Events; Not symmetric!
  // String represents relation qualifier
  pub rels: HashMap<ObjectOrEventIndex, Vec<(ObjectIndex, String)>>,
  // Symmetric relations: Object/Event Index maps to set of associated Object/Event index; boolean flag is true if the relation is reversed and a String for the qualifier
  pub symmetric_rels: HashMap<ObjectOrEventIndex, HashSet<(ObjectOrEventIndex, bool, String)>>,
}

impl IndexLinkedOCEL {
  pub fn new(ocel: OCEL) -> Self {
      link_ocel_info(ocel)
  }
  pub fn ev_by_index<'a>(&'a self, index: &EventIndex) -> Option<&'a OCELEvent> {
      self.ocel.events.get(index.0)
  }
  pub fn ob_by_index<'a>(&'a self, index: &ObjectIndex) -> Option<&'a OCELObject> {
      self.ocel.objects.get(index.0)
  }

  pub fn index_of_ob<'a>(&'a self, ob_id: &String) -> Option<&'a ObjectIndex> {
      self.object_index_map.get(ob_id)
  }

  pub fn ob_by_id<'a>(&'a self, ob_id: &String) -> Option<&'a OCELObject> {
      self.index_of_ob(ob_id)
          .and_then(|ob_index| self.ob_by_index(ob_index))
  }

  pub fn index_of_ev<'a>(&'a self, ev_id: &String) -> Option<&'a EventIndex> {
      self.event_index_map.get(ev_id)
  }

  pub fn ob_or_ev_by_index(&self, index: ObjectOrEventIndex) -> Option<OCELNodeRef> {
      match index {
          ObjectOrEventIndex::Object(ob_index) => {
              self.ob_by_index(&ob_index).map(OCELNodeRef::Object)
          }
          ObjectOrEventIndex::Event(ev_index) => {
              self.ev_by_index(&ev_index).map(OCELNodeRef::Event)
          }
      }
  }
  pub fn get_symmetric_rels_ob(
      &self,
      index: &ObjectIndex,
  ) -> Option<&HashSet<(ObjectOrEventIndex, bool, String)>> {
      self.symmetric_rels.get(&ObjectOrEventIndex::Object(*index))
  }
  pub fn get_symmetric_rels_ev(
      &self,
      index: &EventIndex,
  ) -> Option<&HashSet<(ObjectOrEventIndex, bool, String)>> {
      self.symmetric_rels.get(&ObjectOrEventIndex::Event(*index))
  }
}

pub fn link_ocel_info(ocel: OCEL) -> IndexLinkedOCEL {
  let object_map: HashMap<String, &OCELObject> = ocel
      .objects
      .iter()
      .map(|obj| (obj.id.clone(), obj))
      .collect();

  let events_of_type = ocel
      .event_types
      .iter()
      .map(|ev_type| {
          (
              ev_type.name.clone(),
              ocel.events
                  .iter()
                  .enumerate()
                  .filter(|(_index, ev)| ev.event_type == ev_type.name)
                  .map(|(index, _)| EventIndex(index))
                  .collect(),
          )
      })
      .collect();

  let objects_of_type = ocel
      .object_types
      .iter()
      .map(|obj_type| {
          (
              obj_type.name.clone(),
              ocel.objects
                  .iter()
                  .enumerate()
                  .filter(|(_index, ob)| ob.object_type == obj_type.name)
                  .map(|(index, _)| ObjectIndex(index))
                  .collect(),
          )
      })
      .collect();

  let event_index_map = ocel
      .events
      .iter()
      .enumerate()
      .map(|(i, e)| (e.id.clone(), EventIndex(i)))
      .collect();
  let object_index_map = ocel
      .objects
      .iter()
      .enumerate()
      .map(|(i, o)| (o.id.clone(), ObjectIndex(i)))
      .collect();
  let object_events_map = get_object_events_map(&ocel, &object_index_map);
  let object_rels_per_type = get_object_rels_per_type(&ocel, &object_map);
  let mut rels: HashMap<ObjectOrEventIndex, Vec<(ObjectIndex, String)>> = HashMap::new();
  let mut symmetric_rels: HashMap<
      ObjectOrEventIndex,
      HashSet<(ObjectOrEventIndex, bool, String)>,
  > = HashMap::new();
  for (e_index_usize, e) in ocel.events.iter().enumerate() {
      let e_index = ObjectOrEventIndex::Event(EventIndex(e_index_usize));
      for r in e.relationships.iter().flatten() {
          if let Some(object_index) = object_index_map.get(&r.object_id) {
              let o2_index = ObjectOrEventIndex::Object(*object_index);
              symmetric_rels.entry(e_index).or_default().insert((
                  o2_index,
                  false,
                  r.qualifier.clone(),
              ));
              symmetric_rels.entry(o2_index).or_default().insert((
                  e_index,
                  true,
                  r.qualifier.clone(),
              ));
              rels.entry(e_index)
                  .or_default()
                  .push((*object_index, r.qualifier.clone()));
          }
      }
  }
  for (o_index_usize, o) in ocel.objects.iter().enumerate() {
      let o_index = ObjectOrEventIndex::Object(ObjectIndex(o_index_usize));
      for r in o.relationships.iter().flatten() {
          if let Some(object_index) = object_index_map.get(&r.object_id) {
              let o2_index = ObjectOrEventIndex::Object(*object_index);
              symmetric_rels.entry(o_index).or_default().insert((
                  o2_index,
                  false,
                  r.qualifier.clone(),
              ));
              symmetric_rels.entry(o2_index).or_default().insert((
                  o_index,
                  true,
                  r.qualifier.clone(),
              ));
              rels.entry(o_index)
                  .or_default()
                  .push((*object_index, r.qualifier.clone()));
          }
      }
  }
  IndexLinkedOCEL {
      events_of_type,
      objects_of_type,
      object_events_map,
      object_rels_per_type,
      ocel,
      event_index_map,
      object_index_map,
      rels,
      symmetric_rels,
  }
}


#[derive(Debug, Serialize, Deserialize)]
pub struct OCELInfo {
    pub num_objects: usize,
    pub num_events: usize,
    pub object_types: Vec<OCELType>,
    pub event_types: Vec<OCELType>,
    pub object_ids: Vec<String>,
    pub event_ids: Vec<String>,
}

impl From<&OCEL> for OCELInfo {
    fn from(val: &OCEL) -> Self {
        OCELInfo {
            num_objects: val.objects.len(),
            num_events: val.events.len(),
            object_types: val.object_types.clone(),
            event_types: val.event_types.clone(),
            event_ids: val.events.iter().map(|ev| ev.id.clone()).collect(),
            object_ids: val.objects.iter().map(|ob| ob.id.clone()).collect(),
        }
    }
  }