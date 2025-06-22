<script lang="ts">
  export let type: "button" | "submit" | "reset" = "button";
  export let variant: "primary" | "secondary" | "danger" = "primary";
  export let disabled: boolean = false;
  export let className: string = "";
  let cls: string = ""; // Alternative class binding
  export { cls as class };
</script>

<button
  type={type}
  class={`px-4 py-2 rounded-md font-medium focus:outline-none transition
    ${variant === "primary"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : variant === "secondary"
      ? "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
      : "bg-red-600 hover:bg-red-700 text-white"}
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${className} ${cls}
  `}
  disabled={disabled}
  on:click
>
  <slot />
</button>
