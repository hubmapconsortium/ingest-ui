export function flattenSampleType(sample_types) {
  let sample_types_flatten = {};

  sample_types.forEach(group => {
    Object.assign(sample_types_flatten, group);
  });

  return sample_types_flatten;
}
