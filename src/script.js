import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Vector3 } from 'three'
import typeface from 'three/examples/fonts/helvetiker_regular.typeface.json'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import * as dat from 'lil-gui'

const gui = new dat.GUI()

class PHIvector
{
	constructor(name,color,orig,dir)
	{
		this.name = name ;

		if(color === undefined) color = 0xffffff ;
		this.color = new THREE.Color(color) ;

		if(dir === undefined) this.dir = new THREE.Vector3(1,0,0) ;
		else this.dir = dir ;

		if(orig === undefined)  this.o = new THREE.Vector3(0,0,0) ;
		else this.o = orig ;

		this.helper = new THREE.ArrowHelper(this.normal_dir,this.o,this.length,this.color,0.08*1.5,0.03*1.5) ;
		this.normal_dir = this.dir.clone() ;
		this.computeNormalizedDirection() ;
		scene.add(this.helper) ; // Scene usato così fa riferimento a una scene globale esterna... assicurarsi che esista prima di creare il vettore!!!
		
		this.dependencies = [] ;

		this.guiControllers = [] ;
		let folder = gui.addFolder(name);
		/*this.guiControllers.push(gui.add(this.o, 'x').min(-3).max(3).step(0.1).name(this.name+' origin x'))
		this.guiControllers.push(gui.add(this.o, 'y').min(-3).max(3).step(0.1).name(this.name+' origin y'))
		this.guiControllers.push(gui.add(this.o, 'z').min(-3).max(3).step(0.1).name(this.name+' origin z'))*/
		this.guiControllers.push(folder.add(this.dir, 'x').min(-3).max(3).step(0.1).name('X'))
		this.guiControllers.push(folder.add(this.dir, 'y').min(-3).max(3).step(0.1).name('Y'))
		this.guiControllers.push(folder.add(this.dir, 'z').min(-3).max(3).step(0.1).name('Z'))
		this.guiControllers.push(folder.addColor(this.helper.line.material, 'color').
			min(-3).max(3).step(0.1).name('Z')
			.onChange(value => {

				// We have to update the arrow color and the text color too!
				this.helper.setColor(value) ;
				this.text.material.color.set(value) ;
			})
		) ;
		this.guiControllers.push(folder.add(this.helper,'visible'))

		// TODO: fixed 3D text isn't always that visible. Billboarding is a better option.
		// Regular DOM divs absolutely positioned over the canvas in CSS are ok too.
		const mat = new THREE.MeshBasicMaterial();
		mat.color.set(this.color) ;

		let text = null ;
		const loader = new FontLoader();
		loader.load( '/fonts/helvetiker_regular.typeface.json', (font) => {
			let geom = new TextGeometry(this.name, {
				font: font,
				size: .04,
				height: .001,
				curveSegments: 8,
				bevelEnabled: false,
				bevelThickness: 10,
				bevelSize: 8,
				bevelOffset: 0,
				bevelSegments: 5
			} );
			this.text = new THREE.Mesh(geom,mat)

			// Places the vector name at 60% of the vector's length
			this.text.position.copy(this.interpolateDir(0.6)) ;
			this.text.visible = false ; // sum, sub,cross... all of them starts hidden, in order to avoid polluting the screen

			// Adds the vector name to the scene
			scene.add(this.text);
		} );	
	}

	// When the vector shows/hides its name must di the same!
	setVisible(bShow)
	{
		if(this.text) this.text.visible = bShow ;
		this.helper.visible = bShow ;
	}

	// Returns the coordinates (as a Vector3) of this PHIvector head, relative to the origin
	// This is simply the vector sun of this vector tail and this vector 
	vectorHead()
	{
		let p = new THREE.Vector3() ;
		p.copy(this.o).add(this.dir) ;
		return p ;
	}

	// Returns the coordinates (as a Vector3 relative to the origin) of an 
	// intermediate point of this vector, specified as a fraction of the vector length.
	interpolateDir(where)
	{
		let cl = this.dir.clone() ;
		cl.multiplyScalar(where) ;

		let p = new THREE.Vector3() ;
		p.copy(this.o).add(cl) ;
		return p ;
	}

	// Remove the vector from the scene and frees all the allocated resources. This only in
	// theory: in fact it's not working because it's not yet used. TODO in future enhancements.
	dispose()
	{
		scene.remove(this.helper) ;
	}

	// Translates the vector tail and the dir parallel to itself.
	// Not yet used: TODO in future enhancements.
	translate(newOrig)
	{
		if(newOrig != this.o) {
			this.o.copy(newOrig) ;
			this.helper.position.set(newOrig) ;
		}
	}

	// I need to store the vector itself for the computation of sums, subs, crosses...
	// but for reasons that onestly I don't understand, the ArrowHelper does not accept
	// a Vector3, but requires it is given as two separate parameters: the versor and
	// the vector length :(. So, let it be and make here the necessary adjustments.
	computeNormalizedDirection()
	{
		this.normal_dir.copy(this.dir) ;
		this.length = this.normal_dir.length() ;
		this.normal_dir.normalize() ;
		this.helper.setDirection(this.normal_dir) ;

		// Compute the arrow sizes, because the default (proportional!) are way too big, relative
		// to the line length (really, it's a "too much american" arrow!). If the vector gets too 
		// short, we reduce the arrow further (else it would become longer then the vector itself!)
		let l = 0.08*1.5 ;
		let w = 0.03*1.5 ;
		if(this.length == 0) {
			l = 0 ;
			w = 0 ;
		}
		else if(this.length < 0.2) {
			l = l/2 ;//0.2*this.length ;
			w = w/2 ;//0.02*this.length ;
		}

		this.helper.setLength(this.length,l,w);
	}

	// Updates the Controls Panel values when they are changed outside of it, eg 
	// for sum, sub and cross vectors when one of their dependencies is changed.
	updateDisplay()
	{
		for(let c of this.guiControllers) {
			c.updateDisplay() ;
		}
	}

	// Update the vectors, taking into account the adjustments due to changes in the dependencies.
	update()
	{
		// Evaluate dependencies
		for(const d of this.dependencies)
		{
			if(d.type == 'oinarrow') {
				
				// If the dependency is gone, dispose this vector too
				if(d.ops[0] == null) this.dispose() ;
				else {
					// Check vector tail position
					this.o = d.ops[0].vectorHead() ;
					this.helper.position.copy(this.o);
					this.updateDisplay()
				}
			}			
			if(d.type == 'add') {
				// If the dependencies are gone, dispose this vector too
				if(d.ops[0] == null || d.ops[1] == null) this.dispose() ;
				else {
					// Check vector tail position
					if(d.ops[0].o == d.ops[1].o) this.o = d.ops[0].o ;
					else if(d.ops[0].o == d.ops[1].o) this.o = d.ops[0].o ;

					// Check vector components
					this.dir.addVectors(d.ops[0].dir,d.ops[1].dir);

					// Update components values in Controls Panel
					this.updateDisplay()
				}
			}
			if(d.type == 'sub') {
				// If the dependencies are gone, dispose this vector too
				if(d.ops[0] == null || d.ops[1] == null) this.dispose() ;
				else {
					// Check vector tail position
					if(d.ops[0].o == d.ops[1].o) this.o = d.ops[0].o ;
					else if(d.ops[0].o == d.ops[1].o) this.o = d.ops[0].o ;

					// Check vector components
					this.dir.subVectors(d.ops[0].dir,d.ops[1].dir);

					// Update components values in Controls Panel
					this.updateDisplay()
				}
			}
			if(d.type == 'cross') {
				// If the dependencies are gone, dispose this vector too
				if(d.ops[0] == null || d.ops[1] == null) this.dispose() ;
				else {
					// Check vector tail position
					if(d.ops[0].o == d.ops[1].o) this.o = d.ops[0].o ;
					else if(d.ops[0].o == d.ops[1].o) this.o = d.ops[0].o ;

					// Check vector components
					this.dir.crossVectors(d.ops[0].dir,d.ops[1].dir);

					// Update components values in Controls Panel
					this.updateDisplay()
				}
			}			
		}

		// Show/hide vector name and reposition it if dependencies are changed
		if(this.text) {
			this.text.position.copy(this.interpolateDir(0.6)) ;
			this.text.visible = this.helper.visible ;
		}

		this.computeNormalizedDirection() ;
	}

	// Scalar Product
	static dot(a,b)
	{
		let cl = a.dir.clone() ;
		return cl.dot(b.dir) ;
	}

	// Return a PHIvector as the sum of two given vectors
	// Sets the name, gives a color and sets the dependencies
	static add(a,b)
	{
		const o = a.o ;
		let r = new THREE.Vector3().addVectors(a.dir,b.dir) ;
		let res = new PHIvector(a.name+' + '+b.name,0xf57900,a.o,r) ;
		res.setVisible(false) ;
		res.updateDisplay() ;
		res.dependencies.push({type:'add',ops:[a,b]}) ;
		return res ;
	}

	// Return a PHIvector as the difference of two given vectors
	// Sets the name, gives a color and sets the dependencies
	static sub(a,b)
	{
		const o = a.o ;
		let r = new THREE.Vector3().subVectors(a.dir,b.dir) ;
		let res = new PHIvector(a.name+' - '+b.name,0xffff00,b.vectorHead(),r) ;
		res.setVisible(false) ;
		res.updateDisplay() ;
		res.dependencies.push({type:'sub',ops:[a,b]}) ;
		res.dependencies.push({type:'oinarrow',ops:[b]}) ;
		return res ;
	}

	// Return a PHIvector as the Vector Product of two given vectors
	// Sets the name, gives a color and sets the dependencies
	static cross(a,b)
	{
		const o = a.o ;
		let r = new THREE.Vector3().crossVectors(a.dir,b.dir) ;
		let res = new PHIvector(a.name+' x '+b.name,0x129828,b.o,r) ;
		res.setVisible(false) ;
		res.updateDisplay() ;
		res.dependencies.push({type:'cross',ops:[a,b]}) ;
		return res ;
	} 	
}


const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight
}

window.addEventListener('resize', () =>
{
	// Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	// Update camera
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 3
scene.add(camera)

// Add Axes
// TODO: give option to hide z axis, or all axes. Give option to show a grid on x-y plane
var origin = new THREE.Vector3( 0, 0, 0 );
var length = 1.5;
var xHelper = new THREE.ArrowHelper(new THREE.Vector3( 1, 0, 0 ), origin, length, 0xff0000, 0.08*1.5,0.03*1.5 );
var yHelper = new THREE.ArrowHelper(new THREE.Vector3( 0, 1, 0 ), origin, length, 0x00ff00, 0.08*1.5,0.03*1.5  );
var zHelper = new THREE.ArrowHelper(new THREE.Vector3( 0, 0, 1 ), origin, length, 0x0000ff, 0.08*1.5,0.03*1.5  );
scene.add( xHelper );
scene.add( yHelper );
scene.add( zHelper );

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({canvas: canvas})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

var va = new PHIvector('A',0xff00ff,new THREE.Vector3(0,0,0),new THREE.Vector3(0.3,1,0.5))
var vb = new PHIvector('B',0x75507b,new THREE.Vector3(0,0,0),new THREE.Vector3(0.5,0.5,1))
var sum = PHIvector.add(va,vb) ;
var sub = PHIvector.sub(va,vb) ;
var cross = PHIvector.cross(va,vb) ;
var t = {'dot':PHIvector.dot(va,vb)} ;
let folder = gui.addFolder('A*B');
let dotController = folder.add(t,'dot').name('') ;

const clock = new THREE.Clock()
const tick = () =>
{
	const elapsedTime = clock.getElapsedTime()

	// Update controls
	controls.update()
	va.update() ;
	vb.update() ;
	sub.update() ;
	sum.update() ;
	cross.update() ;
	t.dot = PHIvector.dot(va,vb) ;
	t.dot = Math.round(t.dot*100) / 100 ;
	dotController.updateDisplay() ;

	// Render
	renderer.render(scene, camera)

	// Call tick again on the next frame
	window.requestAnimationFrame(tick)
}

tick()