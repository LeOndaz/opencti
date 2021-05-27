// export const flattenObj = (obj) => Object.assign(
//   {},
//   ...(function _flatten(o) {
//     return [].concat(...Object.keys(o)
//       .map((k) => (typeof o[k] === 'object'
//         ? _flatten(o[k])
//         : ({ [k]: o[k] }))));
//   }(obj)),
// );

export function prepareConfig(value, currentKey) {
  let result = {};

  Object.keys(value).forEach((key) => {
    const tempKey = currentKey ? `${currentKey}__${key}` : key;

    if (typeof value[key] !== 'object') {
      result[tempKey] = value[key];
    } else {
      result = { ...result, ...prepareConfig(value[key], tempKey) };
    }
  });

  return result;
}

// eslint-disable-next-line no-bitwise,no-mixed-operators
export const uuid4 = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
