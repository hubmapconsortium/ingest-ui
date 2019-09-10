'''
Created on Sep 1, 2019

@author: chb69
'''
import requests
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
from hubmap_const import HubmapConst
from hm_auth import AuthCache, AuthHelper
from entity import Entity
from uuid_generator import getNewUUID
from neo4j_connection import Neo4jConnection

class Activity:
    
    @staticmethod
    def get_create_activity_statements(current_token, activity_type, inputUUID, outputUUID, metadata_userinfo, provenance_group):
        ret_object = {}
        stmt_list = []
        # create the Activity Entity node
        activity_uuid_record_list = None
        activity_uuid_record = None
        try:
            activity_uuid_record_list = getNewUUID(current_token, activity_type)
            if (activity_uuid_record_list == None) or (len(activity_uuid_record_list) != 1):
                raise ValueError("UUID service did not return a value")
            activity_uuid_record = activity_uuid_record_list[0]
        except requests.exceptions.ConnectionError as ce:
            raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))
    
        activity_record = {HubmapConst.UUID_ATTRIBUTE: activity_uuid_record[HubmapConst.UUID_ATTRIBUTE],
                           HubmapConst.DOI_ATTRIBUTE: activity_uuid_record[HubmapConst.DOI_ATTRIBUTE],
                           HubmapConst.DISPLAY_DOI_ATTRIBUTE: activity_uuid_record['displayDoi'],
                           HubmapConst.ACTIVITY_TYPE_ATTRIBUTE: activity_type}
        stmt = Neo4jConnection.get_create_statement(activity_record, HubmapConst.ACTIVITY_NODE_NAME, activity_type, False)
        stmt_list.append(stmt)
        ret_object['activity_uuid'] = activity_uuid_record
    
        # create the Activity Metadata node
        activity_metadata_record = {}
        activity_metadata_uuid_record_list = None
        activity_metadata_uuid_record = None
        try:
            activity_metadata_uuid_record_list = getNewUUID(current_token, HubmapConst.METADATA_TYPE_CODE)
            if (activity_metadata_uuid_record_list == None) or (len(activity_metadata_uuid_record_list) != 1):
                raise ValueError("UUID service did not return a value")
            activity_metadata_uuid_record = activity_metadata_uuid_record_list[0]
        except requests.exceptions.ConnectionError as ce:
            raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))
        ret_object['activity_metadata_uuid'] = activity_metadata_uuid_record
    
        stmt = Activity.get_create_activity_metadata_statement(activity_metadata_record, activity_metadata_uuid_record, activity_uuid_record, metadata_userinfo, provenance_group)
        stmt_list.append(stmt)
        stmt = Neo4jConnection.create_relationship_statement(ret_object['activity_uuid'][HubmapConst.UUID_ATTRIBUTE], HubmapConst.HAS_METADATA_REL, ret_object['activity_metadata_uuid'][HubmapConst.UUID_ATTRIBUTE])
        stmt_list.append(stmt)
        stmt = Neo4jConnection.create_relationship_statement(inputUUID, HubmapConst.ACTIVITY_INPUT_REL, ret_object['activity_uuid'][HubmapConst.UUID_ATTRIBUTE])
        stmt_list.append(stmt)
        stmt = Neo4jConnection.create_relationship_statement(ret_object['activity_uuid'][HubmapConst.UUID_ATTRIBUTE], HubmapConst.ACTIVITY_OUTPUT_REL, outputUUID)
        stmt_list.append(stmt)
        ret_object['statements'] = stmt_list
        return ret_object
    
    @staticmethod
    def get_create_activity_metadata_statement(activity_metadata_record, activity_metadata_uuid_record, activity_uuid_record, metadata_userinfo, provenance_group):
        activity_metadata_record[HubmapConst.UUID_ATTRIBUTE] = activity_metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]
        activity_metadata_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.METADATA_TYPE_CODE
        activity_metadata_record[HubmapConst.REFERENCE_UUID_ATTRIBUTE] = activity_uuid_record[HubmapConst.UUID_ATTRIBUTE]
        activity_metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
        activity_metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
        activity_metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[
            HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
        activity_metadata_record[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE] = provenance_group['name']
        activity_metadata_record[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE] = provenance_group['uuid']
        stmt = Neo4jConnection.get_create_statement(
            activity_metadata_record, HubmapConst.METADATA_NODE_NAME, HubmapConst.METADATA_TYPE_CODE, True)
        return stmt
