'''
Created on Apr 18, 2019

@author: chb69
'''
from builtins import staticmethod

class HubmapConst(object):
    ENTITY_NODE_NAME = 'Entity'
    ACTIVITY_NODE_NAME = 'Activity'
    AGENT_NODE_NAME = 'Agent'
    METADATA_NODE_NAME = 'Metadata'
    COLLECTION_NODE_NAME = 'Collection'

    CREATED_REL = 'CREATED'
    DERIVED_FROM_REL = 'DERIVED_FROM'
    PERFORMED_BY_REL = 'PERFORMED_BY'
    LAB_CREATED_AT_REL = 'LAB_CREATED_AT'
    CREATED_BY_REL = 'CREATED_BY'
    ACTIVITY_INPUT_REL = 'ACTIVITY_INPUT'
    ACTIVITY_OUTPUT_REL = 'ACTIVITY_OUTPUT'
    HAS_METADATA_REL = 'HAS_METADATA'
    HAS_PROVENANCE_REL = 'HAS_PROVENANCE'
    IN_COLLECTION_REL = 'IN_COLLECTION'

    TYPE_ATTRIBUTE = 'type'
    DESCRIPTION_ATTRIBUTE = 'description'
    NAME_ATTRIBUTE = 'label'
    DISPLAY_NAME_ATTRIBUTE = 'displayname'
    DATASET_STATUS_ATTRIBUTE = 'status'
    DATASET_STATUS_NEW = 'New'
    DATASET_STATUS_INVALID = 'Invalid'
    DATASET_STATUS_VALID = 'Valid'
    DATASET_STATUS_PUBLISHED = 'Published'
    DATASET_STATUS_REOPENED = 'Reopened'
    DATASET_STATUS_LOCKED = 'Locked'
    DATASET_STATUS_UNPUBLISHED = 'Unpublished'
    DATASET_STATUS_QA = 'QA'
    DATASET_STATUS_DEPRECATED = 'Deprecated'
    DATASET_STATUS_OPTIONS = [DATASET_STATUS_NEW,DATASET_STATUS_INVALID,DATASET_STATUS_VALID,
                              DATASET_STATUS_PUBLISHED,DATASET_STATUS_REOPENED,DATASET_STATUS_LOCKED,
                              DATASET_STATUS_UNPUBLISHED,DATASET_STATUS_QA,DATASET_STATUS_DEPRECATED]
    FILE_PATH_ATTRIBUTE = 'filepath'
    HAS_PHI_ATTRIBUTE = 'hasphi'
    UUID_ATTRIBUTE = 'uuid'
    ENTITY_TYPE_ATTRIBUTE = 'entitytype'
    ACTIVITY_TYPE_ATTRIBUTE = 'activitytype'
    AGENT_TYPE_ATTRIBUTE = 'agenttype'
    METADATA_TYPE_ATTRIBUTE = 'metadatatype'
    PROVENANCE_CREATE_TIMESTAMP_ATTRIBUTE = 'provenance_create_timestamp'
    PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE = 'provenance_modified_timestamp'
    PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE = 'provenance_user_displayname'
    PROVENANCE_USER_EMAIL_ATTRIBUTE = 'provenance_user_email'
    PROVENANCE_SUB_ATTRIBUTE = 'provenance_user_sub'
    PROVENANCE_GROUP_UUID_ATTRIBUTE = 'provenance_group_uuid'
    PROVENANCE_GROUP_NAME_ATTRIBUTE = 'provenance_group_name'
    PUBLISHED_TIMESTAMP_ATTRIBUTE = 'published_timestamp'
    PUBLISHED_USER_EMAIL_ATTRIBUTE = 'published_user_email'
    PUBLISHED_SUB_ATTRIBUTE = 'published_user_sub'
    PUBLISHED_USER_DISPLAYNAME_ATTRIBUTE = 'published_user_displayname'
    STATUS_ATTRIBUTE = 'status'
    DOI_ATTRIBUTE = 'doi'
    DISPLAY_DOI_ATTRIBUTE = 'display_doi'
    SAMPLE_TYPE_ATTRIBUTE = 'sample_type'
    SAMPLE_TYPE_OTHER_ATTRIBUTE = 'sample_type_other'
    PROTOCOL_FILE_ATTRIBUTE = 'protocol_file'
    LAB_SAMPLE_ID_ATTRIBUTE = 'lab_tissue_id'
    REFERENCE_UUID_ATTRIBUTE = 'reference_uuid'
    FILE_LIST_ATTRIBUTE = 'file_list'
    IMAGE_FILE_METADATA_ATTRIBUTE = 'image_file_metadata'
    PROTOCOL_FILE_METADATA_ATTRIBUTE = 'protocols'
    #PROTOCOL_FILE_METADATA_ATTRIBUTE = 'protocol_file_metadata'
    METADATA_FILE_ATTRIBUTE = 'metadata_file'
    SPECIMEN_TYPE_ATTRIBUTE = 'specimen_type'
    LAB_IDENTIFIER_ATTRIBUTE = 'hubmap_identifier'
    NEXT_IDENTIFIER_ATTRIBUTE = 'next_identifier'
    DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE = 'globus_directory_url_path'
    DATASET_LOCAL_DIRECTORY_PATH_ATTRIBUTE = 'local_directory_url_path'
    ORGAN_TYPE_ATTRIBUTE = 'organ'
    
    
    #Organ Specifiers
    BLADDER_ORGAN_SPECIFIER = 'BL'
    RIGHT_KIDNEY_ORGAN_SPECIFIER = 'RK'
    LEFT_KIDNEY_ORGAN_SPECIFIER = 'LK'
    HEART_ORGAN_SPECIFIER = 'HT'
    LARGE_INTESTINE_ORGAN_SPECIFIER = 'LI'
    SMALL_INTESTINE_ORGAN_SPECIFIER = 'SI'
    LEFT_LUNG_ORGAN_SPECIFIER = 'LL'
    RIGHT_LUNG_ORGAN_SPECIFIER = 'RL'
    LYMPH_NODE_ORGAN_SPECIFIER = 'LY'
    SPLEEN_ORGAN_SPECIFIER = 'SP'
    THYMUS_ORGAN_SPECIFIER = 'TH'
    URETER_ORGAN_SPECIFIER = 'UR'
    LIVER_ORGAN_SPECIFIER = 'LV'
    OTHER_ORGAN_SPECIFIER = 'OT'
    

    DATASET_TYPE_CODE = 'Dataset'
    DATASTAGE_TYPE_CODE = 'Datastage'
    SUBJECT_TYPE_CODE = 'Subject'
    SOURCE_TYPE_CODE = 'Source'
    SAMPLE_TYPE_CODE = 'Sample'
    DONOR_TYPE_CODE = 'Donor'
    FILE_TYPE_CODE = 'File'
    ORGAN_TYPE_CODE = 'Organ Sample'
    SAMPLE_TYPE_CODE = 'Sample'
    PERSON_TYPE_CODE = 'Person'
    LAB_TYPE_CODE = 'Lab'
    METADATA_TYPE_CODE = 'Metadata'
    COLLECTION_TYPE_CODE = 'Collection'
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
    CREATE_SAMPLE_ACTIVITY_TYPE_CODE = 'Create Sample Activity'
    REGISTER_DONOR_ACTIVITY_TYPE_CODE = 'Register Donor Activity'

    DATASET_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DISPLAY_DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'}]
    ACTIVITY_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : ACTIVITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'}]
    FILE_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : FILE_PATH_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]
    METADATA_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
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
     {'attribute_name' : LAB_IDENTIFIER_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : NEXT_IDENTIFIER_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]
    SAMPLE_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DISPLAY_DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : LAB_IDENTIFIER_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : NEXT_IDENTIFIER_ATTRIBUTE, 'indexed' : 'False', 'required' : 'True'}]
    COLLECTION_REQUIRED_ATTRIBUTE_LIST = [{'attribute_name' : UUID_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : DISPLAY_DOI_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : ENTITY_TYPE_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'},
     {'attribute_name' : NAME_ATTRIBUTE, 'indexed' : 'True', 'required' : 'True'}]


    # Use this method to resolve a specific node type (ex: Donor, Tissue Sample, Create Dataset) to its more general
    # entity type attribute (ex: entitytype, activitytype, agenttype)
    @staticmethod
    def get_general_node_type_attribute(specific_node_type):
        #build a list of the entity types in lowercase:
        entity_type_list = [str(HubmapConst.DATASET_TYPE_CODE).lower(), str(HubmapConst.DATASTAGE_TYPE_CODE).lower(),
                            str(HubmapConst.SUBJECT_TYPE_CODE).lower(), str(HubmapConst.SOURCE_TYPE_CODE).lower(),
                            str(HubmapConst.SAMPLE_TYPE_CODE).lower(), str(HubmapConst.DONOR_TYPE_CODE).lower(),
                            str(HubmapConst.FILE_TYPE_CODE).lower(), str(HubmapConst.ORGAN_TYPE_CODE).lower(),
                            str(HubmapConst.SAMPLE_TYPE_CODE).lower(), str(HubmapConst.PERSON_TYPE_CODE).lower(),
                            str(HubmapConst.METADATA_TYPE_CODE).lower()]
        activity_type_list = [str(HubmapConst.DATA_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.ADD_FILE_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.LAB_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.SEQUENCING_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.ORGAN_DISSECTION_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.DATASET_CREATE_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.DATASTAGE_CREATE_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.DATASET_MODIFY_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.DATASET_LOCK_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.DATASET_REOPEN_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.DATASET_PUBLISH_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.DATASET_VALIDATE_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.DERIVED_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.CREATE_SAMPLE_ACTIVITY_TYPE_CODE).lower(),
                              str(HubmapConst.REGISTER_DONOR_ACTIVITY_TYPE_CODE).lower(), str(HubmapConst.DATASET_REOPEN_ACTIVITY_TYPE_CODE).lower()]


        if str(specific_node_type).lower() in entity_type_list:
            return HubmapConst.ENTITY_TYPE_ATTRIBUTE
        if str(specific_node_type).lower() in activity_type_list:
            return HubmapConst.ACTIVITY_TYPE_ATTRIBUTE
        raise ValueError("Cannot find general node type for " + specific_node_type)

