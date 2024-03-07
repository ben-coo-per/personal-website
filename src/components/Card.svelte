<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { urlFor } from '$lib/utils/image';
	import type { Project } from '$lib/utils/sanity';

	export let project: Project;
</script>

<div class="card">
	{#if project.previewImage}
		<img
			class="card__cover"
			src={urlFor(project.previewImage).width(500).height(300).url()}
			alt="Cover image for {project.title}"
		/>
	{:else}
		<div class="card__cover--none" />
	{/if}

	<div class="card__container">
		<h3 class="card__title">
			<a class="card__link" href={`/post/${project.slug.current}`}>
				{project.title}
			</a>
		</h3>
		<p class="card__excerpt">{project.blurbs[0]}</p>
		<p class="card__date">
			{formatDate(project._createdAt)}
		</p>
	</div>
</div>
