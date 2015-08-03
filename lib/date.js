if (!Date.fromJSON) Date.fromJSON = function(value) {
  if (_.isDate(value)) return value;
  if (_.isString(value)) return new Date(value.replace('T', ' ').substr(0, 19));
};
