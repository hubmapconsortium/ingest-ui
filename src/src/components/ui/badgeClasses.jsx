
// @TODO: Figure out where this is being used over the version in src/utils/badgeClasses.jsx
// & consolidate the two

export function getPublishStatusColor(status, itemID) {
	var badge_class = "";
	//console.log('status', status)\
  if(status=== undefined || !status){
    badge_class = "badge-danger";
    console.log("No Status Value for ID "+itemID)
  }else{
	switch (status.toUpperCase()) {
        case "NEW":
          badge_class = "badge-purple";
          break;
        case "REOPENED":
          badge_class = "badge-purple";
          break;
        case "REORGANIZED":
          badge_class = "badge-info";
          break;
        case "VALID":
          badge_class = "badge-success";
          break;
        case "INVALID":
          badge_class = "badge-danger";
          break;
        case "QA":
          badge_class = "badge-info";
          break;
        case "LOCKED":
          badge_class = "badge-secondary";
          break;
        case "PROCESSING":
          badge_class = "badge-secondary";
          break;
        case "PUBLISHED":
          badge_class = "badge-success";
          break;
        case "UNPUBLISHED":
          badge_class = "badge-light";
          break;
        case "DEPRECATED":
          break;
        case "ERROR":
          badge_class = "badge-danger";
          break;
        case "HOLD":
          badge_class = "badge-dark";
          break;
        case "SUBMITTED":
          badge_class = "badge-info";
          break;
        default:
          break;
      }
      return badge_class;
    }
}
