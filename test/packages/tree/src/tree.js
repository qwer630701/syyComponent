import cloneDeep from "lodash/cloneDeep";

function updateData(_vm) {
  let { data, copyOption } = _vm;
  let obj = initData(_vm, cloneDeep(data));
  let selectedRow = obj.selectedRow;
  _vm.copyData = disabledData(_vm, obj.data);
  if (copyOption.props.autoExpandParent != false) _vm.searchExpand();
  if (selectedRow && selectedRow.key) {
    _vm.$emit("update:selectedKeys", selectedRow.key);
  }
  _vm.$emit("defaultSelected", selectedRow);
}

function updateOption(_vm) {
  let copyOption = cloneDeep(_vm.option);
  let props = copyOption.props;
  _vm.keyField = props && props.replaceFields ? props.replaceFields.key : "key";
  _vm.childrenField =
    props && props.replaceFields ? props.replaceFields.children : "children";
  _vm.titleField =
    props && props.replaceFields ? props.replaceFields.title : "title";
  _vm.copyOption = copyOption;
}

function initData(_vm, data, selectedRow = {}, pindex = [], pIds = [], lv = 0) {
  let { keyField, childrenField, defaultSelectedLv } = _vm;
  for (let i = 0; i < data.length; i++) {
    let item = data[i];
    let index = pindex.concat([i]);
    let ids = pIds.concat([item[keyField]]);
    if (
      defaultSelectedLv > -1 &&
      defaultSelectedLv == lv &&
      !item.disabled &&
      JSON.stringify(selectedRow) === "{}"
    ) {
      selectedRow = {
        row: item,
        key: [item[keyField]]
      };
    }
    item.scopedSlots = { title: "title" };
    item.pindex = pindex;
    item.index = index;
    item.ids = ids;
    item.pIds = pIds;
    if (item[childrenField] && item[childrenField].length > 0) {
      let obj = initData(
        _vm,
        item[childrenField],
        selectedRow,
        index,
        ids,
        lv + 1
      );
      item[childrenField] = obj.data;
      selectedRow = obj.selectedRow;
    }
  }
  return {
    data,
    selectedRow
  };
}

function disabledData(_vm, data, lv = 0) {
  if (_vm.disabledLv == lv) return data;
  let childrenField = _vm.childrenField;
  for (let i = 0; i < data.length; i++) {
    let item = data[i];
    let child = item[childrenField];
    item.disabled = true;
    if (child) child = disabledData(_vm, child, lv + 1);
  }
  return data;
}

function searchBoxRender(h, _vm) {
  let {
    searchOption,
    searchMode,
    searchBtn,
    searchCheckBtn,
    allCheck,
    allUnCheck
  } = _vm;
  if (searchMode < 1) return;
  let mode = searchMode == 1;
  let searchOp = {
    props: {
      ...{ placeholder: "请输入搜索内容" },
      ...searchOption.props
    },
    class: "saerch",
    on: {
      ...searchOption.on,
      change: e => {
        let on = searchOption.on;
        let val = e.target.value;
        let ids = _vm.getSearchIds(_vm.data, val);
        _vm.searchValue = val;

        if (_vm.filterMode == 0) {
          _vm.copyData = _vm.isVisible(ids).data;
        } else {
          _vm.searchExpand();
        }
        if (on && on.change) {
          on.change(e, ids);
        }
      }
    }
  };

  if (searchBtn) {
    searchBtn = h(
      "a-button-group",
      {
        class: "checked-btn"
      },
      [
        h(
          "a-button",
          {
            props: {
              type: "primary"
            },
            class: "btn",
            on: {
              click: allCheck
            }
          },
          ["全选"]
        ),
        h(
          "a-button",
          {
            class: "btn",
            on: {
              click: allUnCheck
            }
          },
          ["取消"]
        )
      ]
    );
  } else if (searchCheckBtn) {
    searchBtn = h("div", { class: "check-all-box" }, [
      "全选",
      h("a-checkbox", {
        on: {
          change: e => {
            if (e.target.checked) {
              allCheck();
            } else {
              allUnCheck();
            }
          }
        }
      })
    ]);
  }

  return h("div", { class: { "saerch-box": true, inline: mode } }, [
    h("a-input-search", searchOp),
    searchBtn
  ]);
}

function treeOptionRender(h, _vm) {
  let {
    selectedKeys,
    copyCheckedKeys,
    copyOption: option,
    expandedKeys,
    copyData,
    titleField
  } = _vm;
  let op = {
    props: {
      ...{ autoExpandParent: true, showLine: true },
      ...option.props,
      ...(selectedKeys ? { selectedKeys } : {}),
      ...{ expandedKeys },
      ...{ treeData: copyData, checkedKeys: copyCheckedKeys }
    },
    style: option.props.style,
    on: {
      ...option.on,
      "update:expandedKeys": val => {
        _vm.expandedKeys = val;
      },
      "update:selectedKeys": val => {
        _vm.$emit("update:selectedKeys", val);
      },
      check: val => {
        _vm.$emit("input", val);
      },
      select: (key, e) => {
        let on = _vm.option.on;
        e.row = _vm.getRow(key);
        on && on.select && on.select(key, e);
      }
    },
    scopedSlots: {
      title: props => {
        let title = props[titleField];
        let val = _vm.searchValue && _vm.searchValue.trim();
        if (
          _vm.filterMode != 0 &&
          !props.disabled &&
          val &&
          title.indexOf(val) > -1
        ) {
          return (
            <span>
              {title.substr(0, title.indexOf(val))}
              <span style="color: #f50">{val}</span>
              {title.substr(title.indexOf(val) + val.length)}
            </span>
          );
        } else {
          return title;
        }
      }
    }
  };
  return h("a-tree", op);
}

export default {
  name: "Tree",
  components: {},
  props: {
    //树形数据
    data: {
      type: Array,
      default: () => []
    },
    option: {
      type: Object,
      default: () => ({})
    },
    searchOption: {
      type: Object,
      default: () => ({
        props: {
          placeholder: "请输入搜索内容"
        }
      })
    },
    //搜索模式
    searchMode: {
      type: Number,
      default: 1
      /**
       * 0  关闭搜索
       * 1  展示搜索  全选按钮横向
       * 2  展示搜索  全选按钮竖向
       */
    },
    searchCheckBtn: {
      type: Boolean,
      default: false
    },
    searchBtn: {
      type: Boolean,
      default: false
    },
    //多选选中项
    checkedKeys: {
      type: Array,
      default: () => []
    },
    //单选选中项
    selectedKeys: {
      type: Array,
      default: () => []
    },
    //禁用等级
    disabledLv: {
      type: Number,
      default: 0
    },
    //是否展开全部
    expandAll: {
      type: Boolean,
      default: true
    },
    //默认选中等级
    defaultSelectedLv: {
      type: Number,
      default: -1
    },
    /*
      过滤模式
      0  隐藏多余数据
      1  收缩其他数据
    */
    filterMode: {
      type: [Number, String],
      default: 0
    }
  },
  model: {
    prop: "checkedKeys"
  },
  data() {
    return {
      copyData: [],
      copyOption: {},
      copyCheckedKeys: [],
      searchValue: "",
      expandedKeys: [],
      keyField: "key",
      childrenField: "children",
      titleField: "title"
    };
  },
  watch: {
    data() {
      updateData(this);
    },
    option() {
      updateOption(this);
    },
    checkedKeys(val) {
      this.copyCheckedKeys = val;
    },
    copyCheckedKeys(val) {
      this.$emit("input", val);
    }
  },
  computed: {
    dataList() {
      return this.generateList(this.copyData);
    }
  },
  created() {
    this.copyCheckedKeys = this.checkedKeys;
    updateOption(this);
    updateData(this);
  },
  methods: {
    getRow(id) {
      let { dataList, keyField } = this;
      var index = dataList.findIndex(p => p[keyField] == id);
      return index > -1 ? dataList[index] : undefined;
    },
    allCheck() {
      this.copyCheckedKeys = this.findAllIds([], this.copyData);
    },
    allUnCheck() {
      this.copyCheckedKeys = [];
    },
    findAllIds(arr, data) {
      for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (!item.disabled) {
          arr.push(item.key);
        }
        if (item.children && item.children.length > 0) {
          arr = this.findAllIds(arr, item.children);
        }
      }
      return arr;
    },
    getSearchIds(data, val, ids = []) {
      let { keyField, childrenField, titleField } = this;
      for (let i = 0; i < data.length; i++) {
        let item = data[i];
        let child = item[childrenField];
        val = val && val.trim();
        if (
          (!item.disabled && val && item[titleField].indexOf(val) > -1) ||
          val.trim() == ""
        ) {
          ids.push(item[keyField]);
        }
        if (child && child.length > 0) {
          ids = this.getSearchIds(child, val, ids);
        }
      }
      return ids;
    },
    isVisible(ids, data, isChildExist) {
      let { keyField, childrenField } = this;
      let isParentExist = false;
      data = data ? data : this.data;

      data = data.map(p => {
        var itemExist = false;
        p.class = "";
        if (ids.includes(p[keyField])) {
          itemExist = true;
          isParentExist = true;
        }

        if (p[childrenField] && p[childrenField].length > 0) {
          let res = this.isVisible(ids, p[childrenField], itemExist);
          p[childrenField] = res.data;
          if (!isParentExist) isParentExist = res.isExist;
          if (!itemExist) itemExist = res.isExist;
        }

        if (!itemExist && !isChildExist) {
          p.class = "hidden";
        }
        return p;
      });
      return { data, isExist: isParentExist };
    },
    searchExpand() {
      let { searchValue, copyData, dataList, titleField } = this;
      let expandedKeys = [];
      if (searchValue) {
        dataList.map(p => {
          if (!p.disabled && p[titleField].indexOf(searchValue) > -1) {
            expandedKeys = expandedKeys.concat(p.pIds);
          }
        });
      } else {
        expandedKeys = this.expandALlIds(expandedKeys, copyData);
      }
      this.expandedKeys = expandedKeys;
    },
    expandALlIds(arr, data) {
      let { keyField, childrenField } = this;
      for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (item[childrenField] && item[childrenField].length > 0) {
          arr.push(item[keyField]);
          arr = this.expandALlIds(arr, item[childrenField]);
        }
      }
      return arr;
    },
    generateList(data) {
      let { childrenField } = this;
      let list = [];
      for (let i = 0; i < data.length; i++) {
        let item = data[i];
        list.push(item);
        if (item[childrenField]) {
          list = list.concat(this.generateList(item[childrenField]));
        }
      }
      return list;
    }
  },
  render(h) {
    return h("div", { class: "tree-wrapper" }, [
      searchBoxRender(h, this),
      treeOptionRender(h, this)
    ]);
  }
};
