// {
//   class A {}
//   Object.defineProperty(A.prototype, '', {
//     value: function (params) {
//       return params;
//     },
//   });
//   const a = new A();
//   console.log('name:', '[' + a[''].name + ']'); // 'string'
//   console.log('toString:', a[''].toString()); // 'string'
// }
// console.log('------------------');
// {
//   class A {}
//   A.prototype[''] = function (params) {
//     return params;
//   };
//   const a = new A();
//   console.log('name:', '[' + a[''].name + ']'); // 'string'
//   console.log('toString:', a[''].toString()); // 'string'
// }
// console.log('------------------');
// {
//   const originProxy = Proxy;
//   Proxy = null;
//   console.log('Proxy:', Proxy); // null
//   console.log('originProxy:', originProxy); // null
// }
// {
//   class A {
//     constructor(asdf) {
//       console.log('A constructor', asdf);
//     }
//   }
//   const fp = new Proxy(A, {
//     apply(target, args) {
//       return {};
//     },
//   });

//   console.log(A.prototype.constructor === A);

//   class B extends A {}

//   console.log(A.length);
// }
{
  const A = eval(`(class A{})`);
  console.log(A.toString());
  console.log(new A());
}
