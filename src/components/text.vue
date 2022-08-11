<template>
  <button id="btnGet" @click="get">GET</button>
  <button id="btnpost" @click="post">POST</button>
</template>

<script>
import axios from 'axios'
export default {
    setup(){
        const get = () => {
            axios.get('http://127.0.0.1/api/get')
            .then((res) => {
                console.log(res)
            })
        }
        const post = () => {
            axios.post('http://127.0.0.1/api/post')
            .then((res) => {
                console.log(res)
            })
        }

        return {
            get,
            post
        }
    }
}
</script>

<style>

</style>