import hm_uuid
import pprint


hm_uuid.init()
r0=hm_uuid.worker.newUUIDs(True, "abcdef", "bill-test4", "userId", "userEmail", 5, ["Monday2", "Tuesday2", "Wednesday3", "Thursday4", "Friday5"])
#nUniqueIds(100, hm_uuid.worker.newDoi, "DOI_SUFFIX")
print(r0)
#print(hm_uuid.worker.getIdInfo(r0))

#st = "mystring"
#stn = "123.234"
#sti = "124 "

#print(st.isnumeric())
#print(stn.isnumeric())
#print(sti.isnumeric())