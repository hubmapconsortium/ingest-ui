import { getItem } from "./local_storage"

export const getOrganTermByUserKeyword = (str) => {
  const organsList = getItem('organs_full')
  if (!organsList) return null
  const organs = {}
  for (const o of organsList){
    let term = (o?.category?.term || o.term).toLowerCase()
    if (organs[term] === undefined) {
      organs[term] = []
    }
    organs[term].push(o.rui_code)
  }
  
  const keyword = str.trim().toLowerCase()
  let res = organs[keyword]

  const findByLaterality = (position) => {
    let term = keyword.replace(position, '').replace(/[^a-zA-Z]/g, "").trim()
    for (const o of organsList) {
      if ((o?.category?.term.toLowerCase() === term || o.term.toLowerCase().includes(term)) && 
        o.term.toLowerCase().includes(position)) {
        return o.rui_code
      }
    }
    return organs[keyword.replace(position, '').trim()] // default to find by category
  }

  if (!res && keyword.includes('left')) {
    res = findByLaterality('left')
  }

  if (!res && keyword.includes('right')) {
    res = findByLaterality('right')
  }

  if (!res) {
    res = []
    for (const o of organsList) {
      let term = (o?.category?.term || o.term).toLowerCase();
      if (term.includes(keyword) || o.organ_uberon.toLowerCase().includes(keyword)) {
        res.push(o.rui_code)
      }
    }
  }

  return res
}
