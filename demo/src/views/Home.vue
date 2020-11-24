<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
    <button @click="change">改变</button>
  </div>
</template>

<script>
import less from 'less'
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'Home',
  components: {
    HelloWorld
  },
  mounted(){
    console.log(less.modifyVars)
  },
  methods:{
    change(){
      less.modifyVars({
        "@mainColor":"#333333"
      }).then(()=>{
        console.log("改变成功")
      })
    }
  }
}
</script>
<style lang="less" scoped>
.home{
  background:@mainColor;
}
</style>
