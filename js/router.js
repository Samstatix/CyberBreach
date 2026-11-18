
export function navigate(path) {
    const destination = `#/${path}`;

    if (window.location.hash !== destination) {
        window.location.hash = destination;
    }
}

function readRoute() {
    const path = window.location.hash.replace(/^#\/?/, "");
    const parts = path.split("/").filter(Boolean);

    return {
        page: parts[0] || "overview",
        item: parts[1] || "",
        mode: parts[2] || "academy"
    };
}

export function startRouter(render) {
    function updateScreen() {
        const route = readRoute();
        render(route);
    }

    window.addEventListener("hashchange", updateScreen);

    updateScreen();
}
