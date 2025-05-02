{
  class A {}
  Object.defineProperty(A.prototype, '', {
    value: function (params) {
      return params;
    },
  });
  const a = new A();
  console.log('name:', '[' + a[''].name + ']'); // 'string'
  console.log('toString:', a[''].toString()); // 'string'
}
console.log('------------------');
{
  class A {}
  A.prototype[''] = function (params) {
    return params;
  };
  const a = new A();
  console.log('name:', '[' + a[''].name + ']'); // 'string'
  console.log('toString:', a[''].toString()); // 'string'
}
