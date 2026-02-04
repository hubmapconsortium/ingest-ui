# Scripts breakdown:

  
Reinstall Node Modules: `reinstall_node_modules.sh`

- DEPENDABOT ADDRESSED HERE | Addresses dependabot Issues/PRs by purging node_modules and package-lock.json, then subsequently runs npm install twice (Sometimes rather than installing it just outputs audit details, so running it twice helps ensure everything is properly installed). Once this finished, it stages the package-lock.json file and commits any changes.
    -  `./reinstall_node_modules`
