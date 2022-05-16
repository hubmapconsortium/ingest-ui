# Hubmap Account Access Charts

Table Overview: 

Column | Info 
---------|----------
| Type   | The Type of Entity |
| State  | The Curent State |
|        | (represents Published status for Donors & Samples)|
| Action | What action Are We Detailing 
| Access | Can this be used on **this** kind of  entity in **this** state Do **this** action? 
|        | 🟢 <span style="color:#3CB371"></span> Yes  :x: = No


-------------------------------------------------------------------------------
## Seperated by Type of User Account 
##### (Read, Write, Admin)

-------------------------------------------------------------------------------


### Read 
 > Account: jjw118_hubRead@gmail.com 
 Group: HuBMAP-Read 

Type | State | Action |Access
---------|----------|----------|---------
|📋 __Dataset__ |  | |
|   | New | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | QA | <span style="color:#DC143C">Create</span> |:x: 
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | Invalid | <span style="color:#DC143C"> Create</span>|:x: 
|   |  | <span style="color:#DC143C"> Edit</span>|:x:
|   |  | <span style="color:#3CB371">View</span> |🟢 
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | Error | <span style="color:#DC143C"> Create</span>|:x: 
|   |  | <span style="color:#DC143C"> Edit</span>|:x:
|   |  | <span style="color:#3CB371">View</span> |🟢 
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | Published |<span style="color:#DC143C">Create</span>|:x: 
|   |  | <span style="color:#DC143C"> Edit</span>| 
|   |  | <span style="color:#3CB371">View</span> |🟢 
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|💽 __Uploads__ |  | |
|   | New | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | Invalid | <span style="color:#DC143C">Create</span> |:x: 
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C"> Submit</span> 
|   | Reorganized | <span style="color:#DC143C">Create</span> |:x: 
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C"> Submit</span> 
|😊 __Donors__ |  | |
|   |*Unpublished  | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |*Published  | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|🔬 __Samples__ |  | |
|   |*Unpublished  | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |*Published  | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢

-------------------------------------------------------------------------------


### Write
 > Account: jjw118.pitt.edu (any dev acct should do)
    Group: HuBMAP-Write
    Can create or edit any “Non-Published”  Dataset, Sample or Donor 
    Can create, edit or submit any Upload that is not in the Reorganized state 
    Must be Same Group

#### Access Chart

Type | State | Action |Access
---------|----------|----------|---------
|📋 __Dataset__ |  | |
|   | New |<span style="color:#3CB371"> Create</span> |🟢
|   |  | <span style="color:#3CB371">Edit</span> |🟢
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | QA |<span style="color:#3CB371"> Create</span> |🟢 
|   |  | <span style="color:#3CB371">Edit</span> |🟢
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | Invalid |<span style="color:#3CB371"> Create</span>|🟢 
|   |  | <span style="color:#3CB371">Edit</span>
|   |  | <span style="color:#3CB371">View</span> |🟢 
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | Error |<span style="color:#3CB371"> Create</span>|🟢 
|   |  | <span style="color:#3CB371">Edit</span>
|   |  | <span style="color:#3CB371">View</span> |🟢 
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | Published |<span style="color:#DC143C">Create</span>|:x: 
|   |  | <span style="color:#DC143C"> Edit</span>| 
|   |  | <span style="color:#3CB371">View</span> |🟢 
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|💽 __Uploads__ |  | |
|   | New |<span style="color:#3CB371"> Create</span> |🟢
|   |  | <span style="color:#3CB371">Edit</span> |🟢
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#3CB371">Submit</span> |🟢
|   | Invalid |<span style="color:#3CB371"> Create</span> |🟢 
|   |  | <span style="color:#3CB371">Edit</span> |🟢
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#3CB371">Submit</span> 
|   | Reorganized | <span style="color:#DC143C">Create</span> |:x: 
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#DC143C">View</span> |:x:
|   |  | <span style="color:#DC143C"> Submit</span> 
|😊 __Donors__ |  | |
|   |*Unpublished |<span style="color:#3CB371"> Create</span> |🟢
|   |  | <span style="color:#3CB371">Edit</span> |🟢
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |*Published |<span style="color:#3CB371"> Create</span> |🟢
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|🔬 __Samples__ |  | |
|   |*Unpublished |<span style="color:#3CB371"> Create</span> |🟢
|   |  | <span style="color:#3CB371">Edit</span> |🟢
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |*Published  | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢

>* Published State linked to Ancestor Status 
_(Is this something we can Attach to the Returned JSON details vs having to Scan through potentially a super deep Ancestry tree?)_

-------------------------------------------------------------------------------


### Admin
 > Account: jjw118.hubreadad@gmail.com
     User can submit any Dataset that is in the QA state

#### Access Chart
Type | State | Action |Access
---------|----------|----------|---------
|📋 __Dataset__ |  | |
|   | New | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#DC143C">View</span> |:x:
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | QA | <span style="color:#DC143C">Create</span> |:x: 
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#3CB371">Submit</span> |🟢
|   | Invalid | <span style="color:#DC143C"> Create</span>|:x: 
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | Error | <span style="color:#DC143C"> Create</span>|:x: 
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | Published |<span style="color:#DC143C">Create</span>|:x: 
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|💽 __Uploads__ |  | |
|   | New | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C">Submit</span> |:x:
|   | Invalid | <span style="color:#DC143C">Create</span> |:x: 
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C"> Submit</span> 
|   | Reorganized | <span style="color:#DC143C">Create</span> |:x: 
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|   |  | <span style="color:#DC143C"> Submit</span> 
|😊 __Donors__ |  | |
|   |  | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#3CB371">View</span> |🟢
|🔬 __Samples__ |  | |
|   |  | <span style="color:#DC143C">Create</span> |:x:
|   |  | <span style="color:#DC143C">Edit</span> |:x:
|   |  | <span style="color:#DC143C">View</span> |:x:

-------------------------------------------------------------------------------


### Curraton                
>  Not Needed Currently
- <span style="color:#D3D3D3">~~__Dataset__~~</span>
    - <span style="color:#D3D3D3">  ~~New~~</span>
    - <span style="color:#D3D3D3">  ~~QA~~ </span>
    - <span style="color:#D3D3D3">  ~~Invalid~~</span>
    - <span style="color:#D3D3D3">  ~~Error~~</span>
    - <span style="color:#D3D3D3">  ~~Published~~</span>
- <span style="color:#D3D3D3">~~__Upload__~~</span>
    - <span style="color:#D3D3D3">  ~~New~~</span>
    - <span style="color:#D3D3D3">  ~~Invalid~~</span>
    - <span style="color:#D3D3D3">  ~~Reorganized~~</span>


-------------------------------------------------------------------------------


Ideally a user who Knows The Data is Good can help confirm which entities to refference

***
### Notes:

####  <span style="color:#FFD700">Undocumented Statuses:</span>
* REOPENED
* VALID
* LOCKED
* PROCESSING
* DEPRECATED
* HOLD