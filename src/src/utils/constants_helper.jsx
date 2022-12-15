export function flattenSampleType(sample_types) {
  let sample_types_flatten = {};

  sample_types.forEach(group => {
    Object.assign(sample_types_flatten, group);
  });

  return sample_types_flatten;
}
// export function flattenSampleType(sample_types) {
//   console.debug("flattenSampleType", sample_types, (sample_types instanceof Array));
//   let sample_types_flatten = {};
//   // Hack using instanceof to simplify repalcement of Sample Types with Sample Categories
//   if (sample_types instanceof Array) {
//     sample_types.forEach(group => {
//       Object.assign(sample_types_flatten, group);
//     });
//   }else{
//     sample_types_flatten = sample_types; 
//   }

//   return sample_types_flatten;
// }
