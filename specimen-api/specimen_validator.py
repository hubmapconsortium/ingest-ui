'''
Created on May 15, 2019

@author: chb69
'''
from neo4j import TransactionError, CypherError
import sys
import os
from pprint import pprint
from specimen import Specimen
sys.path.append(os.path.realpath("../common-api"))
from hubmap_const import HubmapConst 
from neo4j_connection import Neo4jConnection
from uuid_generator import getNewUUID
from entity import Entity
from hm_auth import AuthCache

# 
def validate_workflow(json_data):
    # step 1: check that the uuids already exist
    conn = Neo4jConnection()
    if conn.does_identifier_exist(json_data['labuuid']) != True:
        raise LookupError('Cannot find labUUID: ' + json_data['labuuid'])
    if json_data['entitytype'] == HubmapConst.TISSUE_TYPE_CODE:
        if json_data['sourceuuid'] == None or len(json_data['sourceuuid']) == 0:
            raise ValueError('Error: sourceUUID must be set for Tissue datatype')
        if conn.does_identifier_exist(json_data['sourceuuid']) != True:
            raise LookupError('Cannot find sourceUUID: ' + json_data['sourceuuid'])
    #if json_data['metadata'] != None:
    #    validate_metadata(json_data['metadata'])
    
    return True 
    
def validate_specimen(json_data):
    pass

#TODO Move this to the metadata-api microservice
def validate_metadata(json_data):
    pass

#TODO Move this to a file-api microservice
def validate_file(json_data):
    pass

def create_specimen(json_data, token):
    try:
        if validate_workflow(json_data) == True:
            conn = Neo4jConnection()
            driver = conn.get_driver()
            if 'sourceuuid' not in json_data:
                json_data['sourceuuid'] = None
            specimen_uuid_record = Specimen.create_specimen(driver, json_data, token, json_data['labuuid'], json_data['sourceuuid'])
            print("New uuid: ")
            pprint(specimen_uuid_record)
            return specimen_uuid_record

    
    except Exception as e:
        raise e
    



if __name__ == '__main__':
    labCreatedAt = '0ce5be9b-8b7f-47e9-a6d9-16a08df05f50'
    createdBy = '70a43e57-c4fd-4616-ad41-ca8c80d6d827'

    uuid_to_modify = 'ec08e0ee-f2f6-4744-acb4-c4c6745eb04f'
    dr_x_uuid = '33a46e57-c55d-4617-ad41-ca8a30d6d844'
    datastage_uuid = 'c67a6dec-5ef8-4728-8f42-b70966edcb7e'
    create_datastage_activity = '05e699aa-0320-48ee-b3bc-f92cd72e9f5f'
    donor_uuid = '91bacfb2a398288222499f4ed208704a'
    current_token = 'AgkbXPxJyQ1Jmg1WXy1nQOJ7VGY5Y9W2nzPGPrlmk0g20lpQavcOCPnYpBDO2VkJkKQq4KwdP3QaMYsjr1xywHxlMb'
    
    #userinfo = AuthCache.userInfo(current_token, True)
    #pprint(userinfo)
    
    specimen_record = {'label': 'test specimen record', 
                       'description': 'test specimen record', 
                       'hasPHI': 'true', 'status': 'Published'}
    donor_input_json = {'entitytype': 'Donor', 'labuuid': labCreatedAt, 'lab_donor_id' : '123', 
                  'label': 'test specimen record', 'protocol' : 'protocol_123.pdf', 'description' : 'this is a description',
                  'metadata':{'metaAttr1':'dataitem1','metaAttr2':'dataitem2'}, 
                  'images': [{'filepath': '/xx/yy/zz/file1.jpg', 'description': 'file1.jpg description'},
                             {'filepath': '/xx/yy/zz/file2.jpg', 'description': 'file2.jpg description'}]}
    donor_uuid_record = create_specimen(donor_input_json, current_token)
    tissue_input_json = {'entitytype': 'Tissue Sample', 'labuuid': labCreatedAt, 'lab_donor_id' : '123', 
              'label': 'test tissue record', 'protocol' : 'protocol_123.pdf', 'description' : 'this is a description',
              'metadata':{'metaAttr1A':'dataitem1A','metaAttr2A':'dataitem2A'}, 'sourceuuid' : donor_uuid_record[HubmapConst.UUID_ATTRIBUTE],
              'images': [{'filepath': '/xx/yy/zz/file1A.jpg', 'description': 'file1A.jpg description'},
                         {'filepath': '/xx/yy/zz/file2A.jpg', 'description': 'file2A.jpg description'}]}
    create_specimen(tissue_input_json, current_token)
    
    
