const production = !process.env.ROLLUP_WATCH; 
module.exports = {

  // purge: {
  //   content: [
  //     "./src/**/*.svelte",
      
  //   ], 
  //   enabled: production // disable purge in dev
  // },
  theme: {
    colors: {
      'white': '#fff',
      'gray': '#D9D9D980',
    },
  }
};
