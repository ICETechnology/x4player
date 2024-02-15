<template>
    <div class="m4c-font-size hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
	},
    mounted() {
        // 舊用戶字型維持預設，新用戶預設字體為大字型，且不顯示提示
        // 用抓取deviceID作為判斷此用戶是否過去曾開啟過app
        if(localStorage.getItem(`${this.projectID}_$STORE_device>deviceID`) && this.$store.state.config.showLargeNotice){
            this.$store.state.config.largeSize = false;
        }else if(!localStorage.getItem(`${this.projectID}_$STORE_device>deviceID`)){
            this.$store.state.config.showLargeNotice = false;
        }
    },
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {
        projectID() {
			return this.$store.state.config.projectID;
		},
    },
}
</script>

<style scoped>
</style>