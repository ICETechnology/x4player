<template>
    <div class="cloud-detail-ctn flex-1 flex-center flex-column">
		<div>云端条件列表元件 (模式 {{this.param.mode}})</div>
		<div>当前 active 状态 : {{active}}</div>
		<div>启动时间 : {{activeTime}}</div>
		<div>停止时间 : {{deactiveTime}}</div>
    </div>
</template>

<script>
export default {
	props: ['param', 'active'],
	data() {
		return {
			activeTime: '',
			deactiveTime: '',
        }
	},
	beforeMount() {
	},
    mounted() {
		if (this.active) {
			this.activeTime = new Date().toLocaleTimeString();
		}
    },
	beforeDestroy() {
	},
	components: {
	},
    methods: {
	},
	watch: {
		active: function(b) {
			// non-active -> active
			if (b) {
				this.activeTime = new Date().toLocaleTimeString();
				this.deactiveTime = "";
			}
			// active -> non-active
			else {
				this.activeTime = "";
				this.deactiveTime = new Date().toLocaleTimeString();
			}
		}		
	},
    computed: {
    }
}
</script>

<style scoped>
.cloud-detail-ctn div {
	margin: 8px;
}
</style>