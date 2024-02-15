<template>
    <div class="from-host-ctn flex-center">{{from}}</div>
</template>

<script>
export default {
    computed: {
		host() {
			return this.$store.state.config.$path.LOGIN_HOST;
		},
		from() {
			if (this.host.indexOf('ss2-dev') !== -1) return 'D';
			else if (this.host.indexOf('ss2-uat') !== -1) return 'U';
			else if (this.host.indexOf('ss2-stage') !== -1) return 'S';
		},
	},
}
</script>

<style scoped>
.from-host-ctn {
	position: absolute;
	right: 1px;
	bottom: 1px;
	z-index: 999;
	font-size: 7px;
	pointer-events: none;
	color: #666;
}
</style>