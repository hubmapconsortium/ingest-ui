
// @TODO: Figure out where this is being used over the version in src/utils/badgeClasses.jsx
// & consolidate the two

import { logger } from "./logger";

export function getPublishStatusColor(status, itemID) {
	var badge_class = "";
  if(status=== undefined || !status){
    badge_class = "badge-danger";
    logger.debug(`getPublishStatusColor.No status ${itemID}`)
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
        case "APPROVAL":
          badge_class = "badge-yellow";
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
        case "RETRACTED":
          badge_class = "badge-retracted";
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
        case "INCOMPLETE":
          badge_class = "badge-incomplete";
          break;
        default:
          break;
      }
      return badge_class;
    }
}

export function badgeClass(status, itemID) {
  return getPublishStatusColor(status, itemID);
}

export function StatusList() {
  return([
    "NEW",
    "REOPENED",
    "REORGANIZED",
    "VALID",
    "INVALID",
    "QA",
    "APPROVAL",
    "LOCKED",
    "PROCESSING",
    "PUBLISHED",
    "RETRACTED",
    "UNPUBLISHED",
    "DEPRECATED",
    "ERROR",
    "HOLD",
    "SUBMITTED",
  ])

}
