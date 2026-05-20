# Scripts breakdown:

  
Reinstall Node Modules: `reinstall_node_modules.sh`

- DEPENDABOT ADDRESSED HERE | Addresses dependabot Issues/PRs by purging node_modules and package-lock.json, then subsequently runs npm install twice (Sometimes rather than installing it just outputs audit details, so running it twice helps ensure everything is properly installed). Once this finishes, it stages the package-lock.json file and commits any changes.
    -  `./reinstall_node_modules`


See DATADOG md files for DD related script breakdowns
- note: Need to sort out datadog ci npm 404 Complication before this can be put to use 
    - https://github.com/DataDog/datadog-ci/issues/1073