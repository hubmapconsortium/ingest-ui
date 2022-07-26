# Hubmap Entity Form Element Tests 

### Donors

* Creation of individual Donors:
  * with no image files
  * with one image file
  * with multiple image files
  * with special characters in the lab id, name, description and image description fields
* Editing of Donors
  * deleting all image files
  * deleting one image file and adding one image file during a single edit
  * adding a new image file to a donor created without an image file
  * editing all text fields

### Samples

* Creation individual samples including:
  * organs
    * at least two RUI (location) valid organs like kidney
    * on RUI invalid organ like blood
  * tissue block levels with RUI valid and invalid organs as source, creating RUI info on one block
  * create slice/section samples with blocks as the sources
  * create multiple slice/section samples at one time
  * create multiple samples with a mix of no uploaded files a metadata file and one and multiple image and thumbnail files
  * create samples with special characters in the text fields
* Edit exiting samples including:
  * editing samples that were created in multiples
  * editing existing RUI information
  * adding RUI information to a block that previously had no RUI information

### Datasets

* Creation of individual Datasets with:
  * both gene sequence information and not
  * multiple data types
  * datasets with single and multiple sources including both dataset and sample sources
  * datasets with special characters in the text fields
* Edit existing datasets including:
  * changing the sources
  * editing the text fields
  * changing the datatype

### Bulk

* Bulk creation of Datasets (Upload), Samples, Donors with all combinations of valid and invalid (should fail..) options
* Editing of Datasets, Samples and Donors that were created in bulk including all changes required by the edits of those created individually above.



# Hubmap Account Access Charts

Table Overview:

| Column | Info |
|----|----|
| Type | The Type of Entity |
| State | The Curent State |
|    | (represents Published status for Donors & Samples) |
| Action | What action Are We Detailing |
| Access | Can this be used on**this** kind of  entity in **this** state Do **this** action? |
|    | 🟢 = Yes:x: = No |


## Seperated by Type of User Account

##### (Read, Write, Admin)

### Read

> Account: jjw118_hubRead@gmail.com
> Group: HuBMAP-Read

| Type | State | Action | Access |
|----|----|----|----|
| 📋__Dataset__ |    |    |    |
|    | New | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | QA | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Invalid | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Error | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Published | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
| 💽__Uploads__ |    |    |    |
|    | New | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Invalid | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Reorganized | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
| 😊__Donors__ |    |    |    |
|    | \*Unpublished | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    | \*Published | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
| 🔬__Samples__ |    |    |    |
|    | \*Unpublished | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    | \*Published | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |


### Write

> Account: jjw118.pitt.edu (any dev acct should do)
> Group: HuBMAP-Write
> Can create or edit any “Non-Published”  Dataset, Sample or Donor
> Can create, edit or submit any Upload that is not in the Reorganized state
> Must be Same Group

#### Access Chart

| Type | State | Action | Access |
|----|----|----|----|
| 📋__Dataset__ |    |    |    |
|    | New | Create | 🟢 |
|    |    | Edit | 🟢 |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | QA | Create | 🟢 |
|    |    | Edit | 🟢 |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Invalid | Create | 🟢 |
|    |    | Edit | 🟢 |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Error | Create | 🟢 |
|    |    | Edit | 🟢 |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Published | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
| 💽__Uploads__ |    |    |    |
|    | New | Create | 🟢 |
|    |    | Edit | 🟢 |
|    |    | View | 🟢 |
|    |    | Submit | 🟢 |
|    | Invalid | Create | 🟢 |
|    |    | Edit | 🟢 |
|    |    | View | 🟢 |
|    |    | Submit | 🟢 |
|    | Reorganized | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | :x: |
|    |    | Submit | :x: |
| 😊__Donors__ |    |    |    |
|    | \*Unpublished | Create | 🟢 |
|    |    | Edit | 🟢 |
|    |    | View | 🟢 |
|    | \*Published | Create | 🟢 |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
| 🔬__Samples__ |    |    |    |
|    | \*Unpublished | Create | 🟢 |
|    |    | Edit | 🟢 |
|    |    | View | 🟢 |
|    | \*Published | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |

> * Published State linked to Ancestor Status
>   *(Is this something we can Attach to the Returned JSON details vs having to Scan through potentially a super deep Ancestry tree?)*


### Admin

> Account: jjw118.hubreadad@gmail.com
> User can submit any Dataset that is in the QA state

#### Access Chart

| Type | State | Action | Access |
|----|----|----|----|
| 📋__Dataset__ |    |    |    |
|    | New | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | QA | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | 🟢 |
|    | Invalid | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Error | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Published | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
| 💽__Uploads__ |    |    |    |
|    | New | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Invalid | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
|    | Reorganized | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
|    |    | Submit | :x: |
| 😊__Donors__ |    |    |    |
|    |    | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |
| 🔬__Samples__ |    |    |    |
|    |    | Create | :x: |
|    |    | Edit | :x: |
|    |    | View | 🟢 |


### 

Ideally a user who Knows The Data is Good can help confirm which entities to refference