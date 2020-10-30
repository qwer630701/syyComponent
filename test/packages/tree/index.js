import tree from "./src/tree.js";

tree.install = function(Vue) {
  Vue.component(tree.name, tree);
};

export const Tree = tree;
export default tree;
