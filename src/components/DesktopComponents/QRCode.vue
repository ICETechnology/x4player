<template>
    <div class="device-link-ctn flex-col pd10 flex-center">
		<div class="flex-center mgtb5" v-html="$ln('扫描同步说明')">
		</div>
		<div class="flex-center mgtb5">
			<div class="pd3 bgc-white">
				<!-- https://www.npmjs.com/package/qrcode.vue/v/1.7.0 -->
				<qrcode-vue :value="qrcodeText" :size="150" level="H" />
			</div>
		</div>
    </div>
</template>

<script>
import QrcodeVue from 'qrcode.vue'
export default {
	props: [],
	data() {
		return {
			qrcodeText: '',
		}
	},
	beforeMount() {
		this.qrcodeText = `{"deviceID": "${this.$store.state.device.deviceID}", "company": "${window.comp}", "product": "${window.prod}"}`;
	},
    mounted() {},
	beforeDestroy() {},
	components: {QrcodeVue,},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>