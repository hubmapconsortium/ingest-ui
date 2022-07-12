# Hubmap Account Access Charts

Table Overview:


| Column | Info                                                                              |
| -------- | ----------------------------------------------------------------------------------- |
| Type   | The Type of Entity                                                                |
| State  | The Curent State                                                                  |
|        | (represents Published status for Donors & Samples)                                |
| Action | What action Are We Detailing                                                      |
| Access | Can this be used on**this** kind of  entity in **this** state Do **this** action? |
|        | 🟢 = Yes:x: = No                                                                  |

---

## Seperated by Type of User Account

##### (Read, Write, Admin)

---

### Read

> Account: jjw118_hubRead@gmail.com
> Group: HuBMAP-Read


| Type          | State        | Action | Access |
| --------------- | -------------- | -------- | -------- |
| 📋__Dataset__ |              |        |        |
|               | New          | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
|               | QA           | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
|               | Invalid      | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
|               | Error        | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
|               | Published    | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
| 💽__Uploads__ |              |        |        |
|               | New          | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
|               | Invalid      | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
|               | Reorganized  | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
| 😊__Donors__  |              |        |        |
|               | *Unpublished | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               | *Published   | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
| 🔬__Samples__ |              |        |        |
|               | *Unpublished | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               | *Published   | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |

---

### Write

> Account: jjw118.pitt.edu (any dev acct should do)
> Group: HuBMAP-Write
> Can create or edit any “Non-Published”  Dataset, Sample or Donor
> Can create, edit or submit any Upload that is not in the Reorganized state
> Must be Same Group

#### Access Chart


| Type          | State        | Action | Access |
| --------------- | -------------- | -------- | -------- |
| 📋__Dataset__ |              |        |        |
|               | New          | Create | 🟢     |
|               |              | Edit   | 🟢     |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
|               | QA           | Create | 🟢     |
|               |              | Edit   | 🟢     |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
|               | Invalid      | Create | 🟢     |
|               |              | Edit   | 🟢     |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
|               | Error        | Create | 🟢     |
|               |              | Edit   | 🟢     |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
|               | Published    | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
|               |              | Submit | :x:    |
| 💽__Uploads__ |              |        |        |
|               | New          | Create | 🟢     |
|               |              | Edit   | 🟢     |
|               |              | View   | 🟢     |
|               |              | Submit | 🟢     |
|               | Invalid      | Create | 🟢     |
|               |              | Edit   | 🟢     |
|               |              | View   | 🟢     |
|               |              | Submit | 🟢     |
|               | Reorganized  | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | :x:    |
|               |              | Submit | :x:    |
| 😊__Donors__  |              |        |        |
|               | *Unpublished | Create | 🟢     |
|               |              | Edit   | 🟢     |
|               |              | View   | 🟢     |
|               | *Published   | Create | 🟢     |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |
| 🔬__Samples__ |              |        |        |
|               | *Unpublished | Create | 🟢     |
|               |              | Edit   | 🟢     |
|               |              | View   | 🟢     |
|               | *Published   | Create | :x:    |
|               |              | Edit   | :x:    |
|               |              | View   | 🟢     |

> * Published State linked to Ancestor Status
>   _(Is this something we can Attach to the Returned JSON details vs having to Scan through potentially a super deep Ancestry tree?)_

---

### Admin

> Account: jjw118.hubreadad@gmail.com
> User can submit any Dataset that is in the QA state

#### Access Chart


| Type          | State       | Action | Access |
| --------------- | ------------- | -------- | -------- |
| 📋__Dataset__ |             |        |        |
|               | New         | Create | :x:    |
|               |             | Edit   | :x:    |
|               |             | View   | 🟢     |
|               |             | Submit | :x:    |
|               | QA          | Create | :x:    |
|               |             | Edit   | :x:    |
|               |             | View   | 🟢     |
|               |             | Submit | 🟢     |
|               | Invalid     | Create | :x:    |
|               |             | Edit   | :x:    |
|               |             | View   | 🟢     |
|               |             | Submit | :x:    |
|               | Error       | Create | :x:    |
|               |             | Edit   | :x:    |
|               |             | View   | 🟢     |
|               |             | Submit | :x:    |
|               | Published   | Create | :x:    |
|               |             | Edit   | :x:    |
|               |             | View   | 🟢     |
|               |             | Submit | :x:    |
| 💽__Uploads__ |             |        |        |
|               | New         | Create | :x:    |
|               |             | Edit   | :x:    |
|               |             | View   | 🟢     |
|               |             | Submit | :x:    |
|               | Invalid     | Create | :x:    |
|               |             | Edit   | :x:    |
|               |             | View   | 🟢     |
|               |             | Submit | :x:    |
|               | Reorganized | Create | :x:    |
|               |             | Edit   | :x:    |
|               |             | View   | 🟢     |
|               |             | Submit | :x:    |
| 😊__Donors__  |             |        |        |
|               |             | Create | :x:    |
|               |             | Edit   | :x:    |
|               |             | View   | 🟢     |
| 🔬__Samples__ |             |        |        |
|               |             | Create | :x:    |
|               |             | Edit   | :x:    |
|               |             | View   | 🟢     |

---

### Curraton

> Not Needed Currently

- ~~📋 __Dataset__~~
  - ~~New~~
  - ~~QA~~
  - ~~Invalid~~
  - ~~Error~~
  - ~~Published~~
- ~~_Upload_~~
  - ~~New~~
  - ~~Invalid~~
  - ~~Reorganized~~

---

Ideally a user who Knows The Data is Good can help confirm which entities to refference
