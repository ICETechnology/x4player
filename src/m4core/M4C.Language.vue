<template>
    <div class="m4c-language hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
	},
	mounted() {
		this.$store.state.lang.mappingTable = (window._language || {}).MappingTable;
	},
    methods: {},
	watch: {},
    computed: {},
}
</script>
