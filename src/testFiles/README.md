//@TODO Explain the whats and whatnots


## **Notes:**

* TSVs and CSVs are interchangeable with the current library processing both
* The **Source** values for these will need to change depending on what’s actually in the database where you’re testing


**HuBMAP-register-organs**: Should go through fine

**HuBMAP-register-organs-BAD**: The first time through will put these organs in properly. The next time through, however, we should have errors regarding too many of a specific organ would get assigned to the donor. Skin, however, should still be fine



These Older files used, no modern replacement for donors yet

**BulkDonorTest**

**BulkSampleTest**

## React migration smoke coverage

Run the non-interactive migration smoke suite with:

```sh
npm test
```

`src/App.test.jsx` verifies:

- the unauthenticated application root renders;
- required `REACT_APP_*` configuration is readable;
- the authenticated search route mounts and requests data;
- MUI Data Grid renders a representative result row;
- the new donor and new sample routes mount their key fields.

Backend and authentication calls are mocked so these checks are deterministic
and do not require credentials or network access.

The following remain manual or deployment-level checks:

- complete institutional login and logout;
- authenticated searches against real Search API data;
- opening and editing existing entities;
- RUI registration, cancellation, and restoration;
- creating or updating entities and bulk uploads;
- browser-console warnings and nginx deep-link refreshes.
