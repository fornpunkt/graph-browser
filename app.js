import Sigma from "sigma";
import Graph from "graphology";
import circular from "graphology-layout/circular";
import forceAtlas2 from "graphology-layout-forceatlas2";

const graph = new Graph({ multi: true });

fetch("data.json").then((response) => {
  return response.json();
}).then((data) => {
  data.forEach(triple => {
    if (!graph.hasNode(triple.subject.value)) {
      graph.addNode(triple.subject.value, { nodeType: triple.subject.type, label: triple.subject.value });
    }

    if (!graph.hasNode(triple.object.value)) {
      graph.addNode(triple.object.value, { nodeType: triple.object.type, label: triple.object.value });
    }
    graph.addEdge(triple.subject.value, triple.object.value, { weight: 1, label: triple.predicate.value });
  });

  init();
})

let state = {}
state.hoveredNode = null;
state.selectedNode = null;
state.suggestions = null;


state.hoveredNeighbors = null;
state.searchQuery = "";

let renderer;
const searchInput = document.getElementById("search-input");
function init() {
  const degrees = graph.nodes().map((node) => graph.degree(node));
  const minDegree = Math.min(...degrees);
  const maxDegree = Math.max(...degrees);
  const minSize = 2,
    maxSize = 15;
  graph.forEachNode((node) => {
    const degree = graph.degree(node);
    graph.setNodeAttribute(
      node,
      "size",
      minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize),
    );
  });

  const colors = { uri: "#FA5A3D", literal: "#5A75DB", bnode: "#FFCE00" };
  graph.forEachNode((node, attributes) => {
    graph.setNodeAttribute(node, "color", colors[attributes.nodeType]);
  }
  );

  circular.assign(graph);
  const settings = forceAtlas2.inferSettings(graph);
  forceAtlas2.assign(graph, { settings, iterations: 600 });

  const loader = document.getElementById("loader");
  loader.style.display = "none";

  const container = document.getElementById("sigma-container");
  renderer = new Sigma(graph, container, {
    renderEdgeLabels: true,
  });

  const searchSuggestions = document.getElementById("suggestions");

  searchSuggestions.innerHTML = graph
    .nodes()
    .map((node) => `<option value="${graph.getNodeAttribute(node, "label")}"></option>`)
    .join("\n");

  searchInput.addEventListener("input", () => {
    setSearchQuery(searchInput.value || "");
  });
  searchInput.addEventListener("blur", () => {
    setSearchQuery("");
  });

  renderer.on("enterNode", ({ node }) => {
    setHoveredNode(node);
  });
  renderer.on("leaveNode", () => {
    setHoveredNode(undefined);
  });

  renderer.setSetting("nodeReducer", (node, data) => {
    const res = { ...data };

    if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
      res.label = "";
      res.color = "#f6f6f6";
    }

    if (state.selectedNode === node) {
      res.highlighted = true;
    } else if (state.suggestions && !state.suggestions.has(node)) {
      res.label = "";
      res.color = "#f6f6f6";
    }

    return res;
  });

  renderer.setSetting("edgeReducer", (edge, data) => {
    const res = { ...data };

    if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
      res.hidden = true;
    }

    if (state.suggestions && (!state.suggestions.has(graph.source(edge)) || !state.suggestions.has(graph.target(edge)))) {
      res.hidden = true;
    }

    return res;
  });
}

function setSearchQuery(query) {
  state.searchQuery = query;

  if (searchInput.value !== query) searchInput.value = query;

  if (query) {
    const lcQuery = query.toLowerCase();
    const suggestions = graph
      .nodes()
      .map((n) => ({ id: n, label: graph.getNodeAttribute(n, "label") }))
      .filter(({ label }) => label.toLowerCase().includes(lcQuery));

    if (suggestions.length === 1 && suggestions[0].label === query) {
      state.selectedNode = suggestions[0].id;
      state.suggestions = undefined;

      const nodePosition = renderer.getNodeDisplayData(state.selectedNode);
      renderer.getCamera().animate(nodePosition, {
        duration: 500,
      });
    }
    else {
      state.selectedNode = undefined;
      state.suggestions = new Set(suggestions.map(({ id }) => id));
    }
  }
  else {
    state.selectedNode = undefined;
    state.suggestions = undefined;
  }

  renderer.refresh();
}

function setHoveredNode(node) {
  if (node) {
    state.hoveredNode = node;
    state.hoveredNeighbors = new Set(graph.neighbors(node));
  } else {
    state.hoveredNode = undefined;
    state.hoveredNeighbors = undefined;
  }

  renderer.refresh();
}
