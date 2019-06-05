'''
Created on Apr 18, 2019

@author: chb69
'''
from builtins import staticmethod

class HubmapConst(object):
    ENTITY_NODE_NAME = 'Entity'
    ACTIVITY_NODE_NAME = 'Activity'
    AGENT_NODE_NAME = 'Agent'

    CREATED_REL = 'CREATED'
    DERIVED_FROM_REL = 'DERIVED_FROM'
    PERFORMED_BY_REL = 'PERFORMED_BY'
    LAB_CREATED_AT_REL = 'LAB_CREATED_AT'
    CREATED_BY_REL = 'CREATED_BY'
    ACTIVITY_INPUT_REL = 'ACTIVITY_INPUT'
    ACTIVITY_OUTPUT_REL = 'ACTIVITY_OUTPUT'
    HAS_METADATA_REL = 'HAS_METADATA'
    HAS_PROVENANCE_REL = 'HAS_PROVENANCE'

    TYPE_ATTRIBUTE = 'type'
    DESCRIPTION_ATTRIBUTE = 'description'
    NAME_ATTRIBUTE = 'label'
    DATASET_STATUS_ATTRIBUTE = 'status'
    DATASET_STATUS_OPTIONS = ['New','Invalid','Valid','Published','Reopened','Locked','Unpublished']
    FILE_PATH_ATTRIBUTE = 'filepath'
    HAS_PHI_ATTRIBUTE = 'hasphi'
    UUID_ATTRIBUTE = 'uuid'
    ENTITY_TYPE_ATTRIBUTE = 'entitytype'
    ACTIVITY_TYPE_ATTRIBUTE = 'activitytype'
    AGENT_TYPE_ATTRIBUTE = 'agenttype'
    METADATA_TYPE_ATTRIBUTE = 'metadatatype'
    PROVENANCE_TIMESTAMP_ATTRIBUTE = 'provenance_timestamp'
    PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE = 'provenance_user_displayname'
    PROVENANCE_USER_EMAIL_ATTRIBUTE = 'provenance_user_email'
    PROVENANCE_SUB_ATTRIBUTE = 'provenance_user_sub'
    PROVENANCE_GROUP_UUID_ATTRIBUTE = 'provenance_group_uuid'
    PROVENANCE_GROUP_NAME_ATTRIBUTE = 'provenance_group_name'
    STATUS_ATTRIBUTE = 'status'
    DOI_ATTRIBUTE = 'doi'
    DISPLAY_DOI_ATTRIBUTE = 'display_doi'
    SPECIMEN_TYPE_ATTRIBUTE = 'specimen_type'
    PROTOCOL_ATTRIBUTE = 'protocol'
    LAB_TISSUE_ID_ATTRIBUTE = 'lab_tissue_id'
    REFERENCE_UUID_ATTRIBUTE = 'reference_uuid'

    DATASET_TYPE_CODE = 'Dataset'
    DATASTAGE_TYPE_CODE = 'Datastage'
    SUBJECT_TYPE_CODE = 'Subject'
    SOURCE_TYPE_CODE = 'Source'
    SAMPLE_TYPE_CODE = 'Sample'
    DONOR_TYPE_CODE = 'Donor'
    FILE_TYPE_CODE = 'File'
    ORGAN_TYPE_CODE = 'Organ Sample'
    TISSUE_TYPE_CODE = 'Tissue Sample'
    PERSON_TYPE_CODE = 'Person'
    METADATA_TYPE_CODE = 'Metadata'
    DATA_ACTIVITY_TYPE_CODE = 'Data Activity'
    ADD_FILE_ACTIVITY_TYPE_CODE = 'Add File Activity'
    LAB_ACTIVITY_TYPE_CODE = 'Lab Activity'
    SEQUENCING_ACTIVITY_TYPE_CODE = 'Sequencing Activity'
    ORGAN_DISSECTION_ACTIVITY_TYPE_CODE = 'Organ Dissection Activity'
    DATASET_CREATE_ACTIVITY_TYPE_CODE = 'Create Dataset Activity'
    DATASTAGE_CREATE_ACTIVITY_TYPE_CODE = 'Create Datastage Activity'
    DATASET_MODIFY_ACTIVITY_TYPE_CODE = 'Modify Dataset Activity'
    DATASET_LOCK_ACTIVITY_TYPE_CODE = 'Lock Dataset Activity'
    DATASET_REOPEN_ACTIVITY_TYPE_CODE = 'Reopen Dataset Activity'
    DATASET_PUBLISH_ACTIVITY_TYPE_CODE = 'Publish Dataset Activity'
    DATASET_VALIDATE_ACTIVITY_TYPE_CODE = 'Validate Dataset Activity'
    DERIVED_ACTIVITY_TYPE_CODE = 'Derived Activity'
    CREATE_TISSUE_ACTIVITY_TYPE_CODE = 'Create Tissue Activity'
    REGISTER_DONOR_ACTIVITY_TYPE_CODE = 'Register Donor Activity'

    DATASTAGE_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : NAME_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'}, {'attribute_name' : DESCRIPTION_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : HAS_PHI_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : STATUS_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_UUID_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_NAME_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]
    DATASET_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : NAME_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'}, {'attribute_name' : DESCRIPTION_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : HAS_PHI_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : STATUS_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_UUID_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_NAME_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]
    ACTIVITY_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : ACTIVITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_UUID_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_NAME_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]
    FILE_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : FILE_PATH_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_UUID_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_NAME_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]
    METADATA_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DISPLAY_DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : REFERENCE_UUID_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_UUID_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_NAME_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]
    PROVENANCE_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DISPLAY_DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_UUID_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_NAME_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]
    DONOR_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DISPLAY_DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_UUID_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_NAME_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]
    TISSUE_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DISPLAY_DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_UUID_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'},
     {'attribute_name' : PROVENANCE_GROUP_NAME_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]


    # Use this method to resolve a specific node type (ex: Donor, Tissue Sample, Create Dataset) to its more general
    # entity type attribute (ex: entitytype, activitytype, agenttype)
    @staticmethod
    def get_general_node_type_attribute(specific_node_type):
        #build a list of the entity types in lowercase:
        entity_type_list = [str(HubmapConst.DATASET_TYPE_CODE).lower(), str(HubmapConst.DATASTAGE_TYPE_CODE).lower(),
                            str(HubmapConst.SUBJECT_TYPE_CODE).lower(), str(HubmapConst.SOURCE_TYPE_CODE).lower(),
                            str(HubmapConst.SAMPLE_TYPE_CODE).lower(), str(HubmapConst.DONOR_TYPE_CODE).lower(),
                            str(HubmapConst.FILE_TYPE_CODE).lower(), str(HubmapConst.ORGAN_TYPE_CODE).lower(),
                            str(HubmapConst.TISSUE_TYPE_CODE).lower(), str(HubmapConst.PERSON_TYPE_CODE).lower(),
                            str(HubmapConst.METADATA_TYPE_CODE).lower()]
        activity_type_list = [str(HubmapConst.DATA_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.ADD_FILE_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.LAB_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.SEQUENCING_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.ORGAN_DISSECTION_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.DATASET_CREATE_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.DATASTAGE_CREATE_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.DATASET_MODIFY_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.DATASET_LOCK_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.DATASET_REOPEN_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.DATASET_PUBLISH_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.DATASET_VALIDATE_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.DERIVED_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.CREATE_TISSUE_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.REGISTER_DONOR_ACTIVITY_TYPE_CODE).lower()]


        if str(specific_node_type).lower() in entity_type_list:
            return HubmapConst.ENTITY_TYPE_ATTRIBUTE
        if str(specific_node_type).lower() in activity_type_list:
            return HubmapConst.ACTIVITY_TYPE_ATTRIBUTE
        return ""

