
# CCF-RUI Integration

The CCF (Common Coordinate Framework)-RUI (Registration User Interface) Integration adds the ability to assign a location to a sample that is derived from an organ.  The Registration User Interface has been developed by the University of Indiana and uses the [Unity](https://unity.com/) cross-platform  environment to build 2 and 3-d gaming applications. At this time, only one organ is available for location mapping - the kidney.  If a sample comes from either the right or left kidney, its location can be mapped onto a 3-d kidney image and the location will be saved in the neo4j database as sample metadata.<br/>

How to use the RUI-Integration interface:

1. Create a new sample with a source of type Organ - Right Kidney or Organ - Left Kidney in the HuBMAP ID System.<br/>
2. Select a Tissue Sample Type from one of the many block types.<br/>
3. Make sure that you specify a Protocol DOI or document.<br/>
4. If you want to generate an ID for a single sample, do not check the "Generate IDs for multiple samples" box. Enter a sample name if needed.  Then click on the "Register Location" button.<br/><br />
   a) The new RUI overlay will appear.  Once the kidney image is visible, drag the crosshairs onto the organ image to the sample location.  You may also click on the 3D preview button and/or toggle the Left/Right widget to fine tune the location.  In addition, you may adjust the size of the sample.  Once you are certain of the location, click on the "Next" button to view a json description of the sample location.  Once "Submit" is clicked, you will be returned to the user interface and a green check mark will appear if the sample location has been saved.  You can view the json if you click on the "View" link.  Save the sample by clicking "Generate ID".<br/><br />
   b) When you edit this sample, an "Edit Sample Ids and Locations" link will become available and you will be able to change sample names and locations.<br/><br/>
5. If you want to generate IDs for multiple samples, click the "Generate IDs for multiple samples" and type in the number of samples you would like to define.  You will be able to name the samples and create location details for all or none of the defined samples once you generate the IDs. Add any additional metatdata such as description or image and click "Generate ID".<br/><br />
   a) On the next page, select the "Assign Lab Ids and Locations" and fill in sample names. To assign locations, click on the "Register Location" button and repeat the steps in item 4a above.  Save.<br/><br/>
   b) On edit, you can click on the "View Location" link to view or edit the sample location.<br/> 

*  The "Register Location" button will not appear if an organ other than Right or Left Kidney is selected as the source type.  In the future, additional organs will be available for location designation.
