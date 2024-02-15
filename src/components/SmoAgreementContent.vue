<template>
	<ScrollBounce class="FULL font-size-small" v-stop-propagation-y @scrollReachBottom="$emit('scrollReachBottom')">
		<div class="flex-1 pdlr5" v-html="htmlContent"></div>
		<LoadingIcon v-model="isLoading" />
	</ScrollBounce>
</template>

<script>
/** 滾動監聽 */
import Vue from 'vue';
import VueWaypoint from 'vue-waypoint'
export default {
	props: [],
	data() {
		return {
			htmlContent: '',
			isLoading: true,
		}
	},
	beforeMount() {},
    mounted() {
		// 取得雲端條件單同意書內容
		let qry = `{"isRelease":"Y", "company": "${window.comp}", "product": "${window.prod}"}`;
		let url = `https://${window.$path.LOGIN_HOST}/ss2/fs/appbo/${this.cloudSmoAgreementVersion}/x4/SmoAgreement.txt?qry=${qry}`;
		fetch(url).then(response => {
			if (!response.ok)
				throw new Error(response.statusText);
			return response.text();
		}).then(data => {
			this.isLoading = false;
			this.htmlContent = data;
			this.$emit('ready');
		}).catch(() => {
			this.isLoading = false;
			this.htmlContent = `<div class="h100p flex-center">${this.$ln('无法取得同意书内容')}</div>`;
			this.$store.state.notify('error', this.$ln('无法取得同意书内容'));
		});		
	},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {
		cloudSmoAgreementVersion() {
			return this.$store.state.config.cloudSmoAgreementVersion;
		},
	},
}
</script>

<style scoped>
</style>