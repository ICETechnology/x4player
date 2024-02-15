<template>
    <div class="m4c-sample hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		M4C.Sample = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'AAA', 'c': 'BBB', 'callback': this.onData.bind(this)});
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>