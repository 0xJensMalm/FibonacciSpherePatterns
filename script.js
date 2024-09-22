let sphere;
let currentThemeIndex;
let subdivisionSlider, zoomSlider, strokeThicknessSlider;

let strokeOn;
let strokeMode;
let strokeThickness;
let themeStrokeColor;

const DRAG_SENSITIVITY = 0.005;
const ROTATION_DECAY = 1;
const MIN_ROTATION_SPEED = 0.001;

const themes = [
  {
    name: "Sunset Citrus",
    colors: ["#FFC300", "#DAF7A6", "#FF5733", "#C70039"],
  },
  {
    name: "Tropical Beach",
    colors: ["#00CED1", "#FF6347", "#32CD32", "#FFD700"],
  },
  {
    name: "Northern Lights",
    colors: ["#120136", "#035AA6", "#40BAD5", "#FCF6B1"],
  },
  {
    name: "Forest Hike",
    colors: ["#2C5F2D", "#97BC62", "#DAD7CD", "#4A5859"],
  },
  {
    name: "Coral Reef",
    colors: ["#F9ED69", "#F08A5D", "#B83B5E", "#6A2C70"],
  },
  {
    name: "Autumn Leaves",
    colors: ["#FFA500", "#FF6347", "#8B4513", "#556B2F"],
  },
  {
    name: "Pastel Dream",
    colors: ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9"],
  },
  {
    name: "Deep Space",
    colors: ["#0C0A3E", "#7B1E7A", "#B33F62", "#F9564F"],
  },
];

class Sphere {
  constructor() {
    this.vertices = [];
    this.faces = [];
    this.faceColors = [];
    this.subdivisionLevel = 2;
    this.radius = 200;
    this.zoom = 1;
    this.rotationX = 0;
    this.rotationY = 0;
    this.rotationSpeedX = 0;
    this.rotationSpeedY = 0;
    this.isDragging = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;
    this.currentPatternIndex = 0;
    this.patterns = [
      new CyclePattern(),
      new AlternatingCyclePattern(),
      new GroupedCyclePattern(),
    ];
  }

  generate() {
    this.vertices = [
      createVector(0, 1, 0),
      createVector(1, 0, 0),
      createVector(0, 0, -1),
      createVector(-1, 0, 0),
      createVector(0, 0, 1),
      createVector(0, -1, 0),
    ];

    this.faces = [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 4],
      [0, 4, 1],
      [5, 2, 1],
      [5, 3, 2],
      [5, 4, 3],
      [5, 1, 4],
    ];

    for (let i = 0; i < this.subdivisionLevel; i++) {
      let newFaces = [];
      for (let face of this.faces) {
        let v1 = p5.Vector.add(
          this.vertices[face[0]],
          this.vertices[face[1]]
        ).normalize();
        let v2 = p5.Vector.add(
          this.vertices[face[1]],
          this.vertices[face[2]]
        ).normalize();
        let v3 = p5.Vector.add(
          this.vertices[face[2]],
          this.vertices[face[0]]
        ).normalize();

        let i1 = this.addVertex(v1);
        let i2 = this.addVertex(v2);
        let i3 = this.addVertex(v3);

        newFaces.push([face[0], i1, i3]);
        newFaces.push([face[1], i2, i1]);
        newFaces.push([face[2], i3, i2]);
        newFaces.push([i1, i2, i3]);
      }
      this.faces = newFaces;
    }

    for (let v of this.vertices) {
      v.mult(this.radius);
    }

    this.applyCurrentPattern();
  }

  addVertex(v) {
    for (let i = 0; i < this.vertices.length; i++) {
      if (p5.Vector.dist(v, this.vertices[i]) < 1e-6) {
        return i;
      }
    }
    return this.vertices.push(v) - 1;
  }

  applyCurrentPattern() {
    this.faceColors = this.patterns[this.currentPatternIndex].apply(
      this.faces,
      themes[currentThemeIndex].colors
    );
  }

  nextPattern() {
    this.currentPatternIndex =
      (this.currentPatternIndex + 1) % this.patterns.length;
    this.applyCurrentPattern();
  }

  draw() {
    push();
    scale(this.zoom);
    rotateX(this.rotationX);
    rotateY(this.rotationY);

    if (strokeOn) {
      strokeWeight(strokeThickness);
      if (strokeMode === "black") {
        stroke(0);
      } else {
        stroke(themeStrokeColor);
      }
    } else {
      noStroke();
    }

    for (let i = 0; i < this.faces.length; i++) {
      fill(this.faceColors[i]);
      beginShape();
      for (let j = 0; j < 3; j++) {
        let v = this.vertices[this.faces[i][j]];
        vertex(v.x, v.y, v.z);
      }
      endShape(CLOSE);
    }
    pop();
  }

  updateRotation() {
    if (!this.isDragging) {
      this.rotationY += this.rotationSpeedY;
      this.rotationX += this.rotationSpeedX;

      this.rotationSpeedY *= ROTATION_DECAY;
      this.rotationSpeedX *= ROTATION_DECAY;

      if (Math.abs(this.rotationSpeedY) < MIN_ROTATION_SPEED)
        this.rotationSpeedY = 0;
      if (Math.abs(this.rotationSpeedX) < MIN_ROTATION_SPEED)
        this.rotationSpeedX = 0;
    }
  }

  mousePressed() {
    this.isDragging = true;
    this.previousMouseX = mouseX;
    this.previousMouseY = mouseY;
  }

  mouseReleased() {
    this.isDragging = false;
  }

  mouseDragged() {
    if (this.isDragging) {
      let deltaX = mouseX - this.previousMouseX;
      let deltaY = mouseY - this.previousMouseY;

      this.rotationSpeedY = deltaX * DRAG_SENSITIVITY;
      this.rotationSpeedX = deltaY * DRAG_SENSITIVITY;

      this.rotationY += this.rotationSpeedY;
      this.rotationX += this.rotationSpeedX;

      this.previousMouseX = mouseX;
      this.previousMouseY = mouseY;
    }
  }
}

class Pattern {
  constructor(name) {
    this.name = name;
  }

  apply(faces, theme) {
    // To be implemented by subclasses
  }
}

class CyclePattern extends Pattern {
  constructor() {
    super("Cycle");
  }

  apply(faces, theme) {
    return faces.map((face, index) => color(theme[index % theme.length]));
  }
}

class AlternatingCyclePattern extends Pattern {
  constructor() {
    super("Alternating Cycle");
  }

  apply(faces, theme) {
    return faces.map((face, index) => {
      let colorIndex = floor(index / 2) % theme.length;
      return color(theme[colorIndex]);
    });
  }
}

class GroupedCyclePattern extends Pattern {
  constructor() {
    super("Grouped Cycle");
  }

  apply(faces, theme) {
    let groupSize = 3;
    return faces.map((face, index) => {
      let colorIndex = floor(index / groupSize) % theme.length;
      return color(theme[colorIndex]);
    });
  }
}

function setup() {
  createCanvas(1000, 1000, WEBGL);

  // Random initialization
  currentThemeIndex = floor(random(themes.length));
  strokeOn = random() > 0.5;
  strokeMode = random() > 0.5 ? "black" : "theme";
  strokeThickness = random(1, 5);
  updateThemeStrokeColor();

  sphere = new Sphere();

  subdivisionSlider = createSlider(0, 5, sphere.subdivisionLevel, 1);
  subdivisionSlider.position(10, height + 10);
  subdivisionSlider.style("width", "200px");

  zoomSlider = createSlider(0.5, 2, 1, 0.1);
  zoomSlider.position(10, height + 40);
  zoomSlider.style("width", "200px");

  strokeThicknessSlider = createSlider(1, 5, strokeThickness, 0.5);
  strokeThicknessSlider.position(10, height + 70);
  strokeThicknessSlider.style("width", "200px");

  sphere.generate();
}

function draw() {
  background(0);

  if (sphere.subdivisionLevel !== subdivisionSlider.value()) {
    sphere.subdivisionLevel = subdivisionSlider.value();
    sphere.generate();
  }

  sphere.zoom = zoomSlider.value();
  strokeThickness = strokeThicknessSlider.value();
  sphere.updateRotation();
  sphere.draw();
}

function updateThemeStrokeColor() {
  themeStrokeColor = color(random(themes[currentThemeIndex].colors));
}

function mousePressed() {
  sphere.mousePressed();
}

function mouseReleased() {
  sphere.mouseReleased();
}

function mouseDragged() {
  sphere.mouseDragged();
}

function keyPressed() {
  if (key === "x" || key === "X") {
    sphere.nextPattern();
  } else if (key === "c" || key === "C") {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    updateThemeStrokeColor();
    sphere.applyCurrentPattern();
  } else if (key === "s" || key === "S") {
    strokeOn = !strokeOn;
  } else if (key === "d" || key === "D") {
    strokeMode = strokeMode === "black" ? "theme" : "black";
    if (strokeMode === "theme") {
      updateThemeStrokeColor();
    }
  }

  console.log(
    "Current Pattern:",
    sphere.patterns[sphere.currentPatternIndex].name
  );
  console.log("Current Theme:", themes[currentThemeIndex].name);
  console.log("Subdivision Level:", sphere.subdivisionLevel);
  console.log("Stroke:", strokeOn ? "On" : "Off");
  console.log("Stroke Mode:", strokeMode);
  console.log("Stroke Thickness:", strokeThickness);
}
