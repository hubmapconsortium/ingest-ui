
export function getPublishStatusColor(status) {
	var badge_class = "";
	//console.log('status', status)
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
        default:
          break;
      }
      return badge_class;
}
