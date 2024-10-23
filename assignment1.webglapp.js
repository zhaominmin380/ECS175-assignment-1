import { hex2rgb, deg2rad, loadExternalFile } from './js/utils/utils.js'
import Input from './js/input/input.js'
import * as mat4 from './js/lib/glmatrix/mat4.js'
import * as vec3 from './js/lib/glmatrix/vec3.js'
import * as quat4 from './js/lib/glmatrix/quat.js'
import { Box } from './js/app/object3d.js'
import { Scene, SceneNode } from './assignment1.scene.js'

 /**
 * @Class
 * WebGlApp that will call basic GL functions, manage camera settings, transformations and scenes, and take care of rendering them
 * 
 */
class WebGlApp {

     /**
     * Initializes the app with a box, and a scene, view, and projection matrices
     * 
     * @param {WebGL2RenderingContext} gl The webgl2 rendering context
     * @param {Shader} shader The shader to be used to draw the object
     * @param {AppState} app_state The state of the UI
     */
    constructor(gl, shader, app_state) {
        // Set GL flags
        this.setGlFlags(gl)

        // Store the shader
        this.shader = shader
        
        // Create a box instance
        this.box = new Box(gl, shader)

        // Declare a variable to hold a Scene
        this.scene = null

        // Bind a callback to the file dialog in the UI that loads a scene file
        app_state.onOpen3DScene((filename) => {
            let scene_config = JSON.parse(loadExternalFile(`./scenes/${filename}`))
            this.scene = new Scene(scene_config, gl, shader)
            return this.scene
        })

        // Create the view matrix
        this.eye = [2.0, 0.5, -2.0]
        this.center = [0, 0, 0]

        this.forward = null
        this.right = null
        this.up = null

        this.updateViewSpaceVectors()
        //TODO: Create a view matrix using glMatrix with the values defined above
        this.view = mat4.lookAt(mat4.create(), this.eye, this.center, [0, 1, 0])

        // Create the projection matrix
        // TODO: Create values the projection matrix
        // TODO: The projection should have a vertical field of view of 60
        // TODO: It should have an 16:9 aspect rotation
        // TODO: Define appropriate values for the near and far plane distance so that the whole scene is visible
        let fovy = deg2rad(60)
        let aspect = 16 / 9
        let near = 0.1
        let far = 100.0
        this.projection = mat4.perspective(mat4.create(), fovy, aspect, near, far)

        // Use the shader's setUniform4x4f function to pass the matrices
        this.shader.use()
        this.shader.setUniform4x4f('u_v', this.view)
        this.shader.setUniform4x4f('u_p', this.projection)
        this.shader.unuse()
    }

     /**
     * Sets up GL flags
     * In this assignment we are drawing 3D data, so we need to enable the flag 
     * for depth testing. This will prevent from geometry that is occluded by other 
     * geometry from 'shining through' (i.e. being wrongly drawn on top of closer geomentry)
     * 
     * Look into gl.enable() and gl.DEPTH_TEST to learn about this topic
     * 
     * @param {WebGL2RenderingContext} gl The webgl2 rendering context
     */
    setGlFlags(gl) {
        gl.enable(gl.DEPTH_TEST)
    }

     /**
     * Sets the viewport of the canvas to fill the whole available space so we draw to the whole canvas
     * 
     * @param {WebGL2RenderingContext} gl The webgl2 rendering context
     * @param {Number} width 
     * @param {Number} height 
     */
    setViewport(gl, width, height) {
        gl.viewport(0, 0, width, height)
    }

    clearCanvas(gl) {
        gl.clearColor(...hex2rgb('#000000'), 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    }

     /**
     * Updates components of this app
     * 
     * @param {WebGL2RenderingContext} gl The webgl2 rendering context
     * @param {AppState} app_state The state of the UI
     * @param {Number} delta_time The time in seconds since the last frame (floating point number)
     */
    update(gl, app_state, delta_time) {

        // Get the draw mode from the app state
        let drawMode = app_state.getState('Draw Mode');

        //  Define the draw mode
        let glDrawMode;
        if (drawMode === 'Points') {
            glDrawMode = gl.POINTS;  // Render as points
        } else if (drawMode === 'Triangles') {
            glDrawMode = gl.TRIANGLES;  // Render as triangles
        }

        // Set the draw mode
        if (this.scene != null) {
            for (let node of this.scene.getNodes()) {
                if (node instanceof SceneNode && node.type === 'model') {
                    node.setDrawMode(glDrawMode);
                }
            }
        }

    
        // Control
        switch (app_state.getState('Control')) {
            case 'Camera':
                this.updateCamera(delta_time);
                break;
            case 'Scene Node':
                if (this.scene == null) break;
    
                // Get the currently selected scene node from the UI
                let scene_node = this.scene.getNode(app_state.getState('Select Scene Node'));
                this.updateSceneNode(scene_node, delta_time);
                break;
        }
    }
    
     /**
     * Update the Forward, Right, and Up vector according to changes in the 
     * camera position (Eye) or the center of focus (Center)
     */
    updateViewSpaceVectors() {
        this.forward = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), this.eye, this.center))
        this.right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), [0, 1, 0], this.forward))
        this.up = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.forward, this.right))
    }
    
    /**
     * Update the camera view based on user input and the arcball viewing model
     * 
     * Supports the following interactions:
     * 1) Left Mouse Button - Rotate the view's center
     * 2) Middle Mouse Button or Space+Left Mouse Button - Pan the view relative view-space
     * 3) Right Mouse Button - Zoom towards or away from the view's center
     * 
     * @param {Number} delta_time The time in seconds since the last frame (floating point number)
     */
    updateCamera(delta_time) {
        let view_dirty = false;
    
        // Control - Zoom
        if (Input.isMouseDown(2)) {
            // TODO: Implement the zoom feature
            // TODO: Transform this.eye - move it closer to this.center by a certain amount along the Forward axis
            // TODO: Use Input.getMouseDy() and delta_time to determine the amount of change
            let zoomAmount = Input.getMouseDy() * delta_time * 0.5;
            vec3.scaleAndAdd(this.eye, this.eye, this.forward, zoomAmount);

             // Set dirty flag to trigger view matrix updates
            view_dirty = true;
        }
    
        // Control - Rotate
        if (Input.isMouseDown(0) && !Input.isKeyDown(' ')) {
            // TODO: Implement the arcball rotation
            // TODO: Transform this.eye - rotate it around the up axis first, then around the right axis
            // TODO: Use Input.getMouseDx(), Input.getMouseDy(), and delta_time to determine the amount of change
            let deltaX = -Input.getMouseDx() * delta_time * 0.5;
            let deltaY = -Input.getMouseDy() * delta_time * 0.5;
    
            // horizontal rotation
            let rotationY = mat4.create();
            mat4.rotate(rotationY, mat4.create(), deltaX, [0, 1, 0]);
            vec3.transformMat4(this.eye, this.eye, rotationY);
    
            // verical rotation
            let rotationX = mat4.create();
            mat4.rotate(rotationX, mat4.create(), deltaY, this.right);
            vec3.transformMat4(this.eye, this.eye, rotationX);
            
            // Set dirty flag to trigger view matrix updates
            view_dirty = true;
        }
    
        // Control - Pan
        if (Input.isMouseDown(1) || (Input.isMouseDown(0) && Input.isKeyDown(' '))) {
            // TODO: Implement the pan interaction
            // TODO: Transform this.eye and this.center to move the camera and the center of attention at the same time
            // TODO: For this, use the view-aligned up and right axes and use those to determine the direction of translation
            // TODO: Use Input.getMouseDx(), Input.getMouseDy(), and delta_time to determine the amount of change
            let panX = -Input.getMouseDx() * delta_time * 0.5;
            let panY = Input.getMouseDy() * delta_time * 0.5;
    
            let rightTranslation = vec3.scale(vec3.create(), this.right, panX);
            let upTranslation = vec3.scale(vec3.create(), this.up, panY);
            vec3.add(this.eye, this.eye, rightTranslation);
            vec3.add(this.center, this.center, rightTranslation);
            vec3.add(this.eye, this.eye, upTranslation);
            vec3.add(this.center, this.center, upTranslation);
            
            // Set dirty flag to trigger view matrix updates
            view_dirty = true;
        }
    
        // Update view matrix if needed
        if (view_dirty) {
            // Update Forward, Right, and Up vectors
            this.updateViewSpaceVectors();
            // TODO: Recompute this.view based on updated values for this.eye (and this.center)
            this.view = mat4.lookAt(mat4.create(), this.eye, this.center, [0, 1, 0]);
            
            // TODO: Update the view matrix in the shader using setUniform4x4f and the new this.view
            // TODO: Don't forget to 'use' the shader first to set it active in WebGL state
            this.shader.use();
            this.shader.setUniform4x4f('u_v', this.view);
            this.shader.unuse();
        }
    }
    /**
     * Update a SceneNode's local transformation
     * 
     * Supports the following interactions:
     * 1) Left Mouse Button - Rotate the node relative to the view along the Up and Right axes
     * 2) Middle Mouse Button or Space+Left Mouse Button - Translate the node relative to the view along the Up and Right axes
     * 3) Right Mouse Button - Scales the node around it's local center
     * 
     * @param {SceneNode} node The SceneNode to manipulate
     * @param {Number} delta_time The time in seconds since the last frame (floating point number)
     */

    updateSceneNode(node, delta_time) {
    
        let node_dirty = false;
    
        let translation = mat4.create();
        let rotation = mat4.create();
        let scale = mat4.create();

        // Control - Scale 
        if (Input.isMouseDown(2)) {
            // TODO: Create a scaling matrix to scale the node
            // TODO: Use Input.getMouseDy() and delta_time to determine the amount of change
            // TODO: Store the matrix in variable 'scale'

            let scaleAmount = 1 + Input.getMouseDy() * delta_time * 0.1;
            mat4.scale(scale, scale, [scaleAmount, scaleAmount, scaleAmount]);

            // Set dirty flag to trigger model matrix updates
            node_dirty = true;
        }
    
        // Control - Rotate 
        if (Input.isMouseDown(0) && !Input.isKeyDown(' ')) {
            // TODO: Create a rotation matrix that rotates the node around the view-aligned axes
            // TODO: Use Input.getMouseDx(), Input.getMouseDy(), and delta_time to determine the amount of change
            // TODO: Store the matrix in variable 'rotation'
            let deltaX = Input.getMouseDx() * delta_time * 0.5; 
            let deltaY = -Input.getMouseDy() * delta_time * 0.5;
    
            mat4.rotate(rotation, rotation, deltaX, [0, 1, 0]);
            mat4.rotate(rotation, rotation, deltaY, this.right);
            
            // Set dirty flag to trigger model matrix updates
            node_dirty = true;
        }
    
        // Control - Translate 
        if (Input.isMouseDown(1) || (Input.isMouseDown(0) && Input.isKeyDown(' '))) {
            let panX = Input.getMouseDx() * delta_time * 0.5;
            let panY = -Input.getMouseDy() * delta_time * 0.5;
            
            // TODO: Create a translation matrix that translates the node along the view-aligned axes
            // TODO: Use Input.getMouseDx(), Input.getMouseDy(), and delta_time to determine the amount of change
            // TODO: Store the matrix in variable 'translation'
            let rightTranslation = vec3.scale(vec3.create(), this.right, panX);
            let upTranslation = vec3.scale(vec3.create(), this.up, panY);
            mat4.translate(translation, translation, rightTranslation);
            mat4.translate(translation, translation, upTranslation);
            
            // Set dirty flag to trigger model matrix updates
            node_dirty = true;
        }
    
        // Apply transformations if necessary
        if (node_dirty) {
            // TODO: Apply the transformations (rotate, scale, translate) to the node's local transformation
            // TODO: The node's current transformation needs to stay intact, so you need to add your transformations to the existing one
            // TODO: Order of multiplication matters. Visualize the transformation that are applied to the node and in which order and how this order affects the node's final configuration
            // TODO: Transformations should be relative to teh current view (i.e. dragging left should translate the node to the left relative to the current view on the object - this is the most intuitive kind of movement and used in many 3D applications)
            // TODO: For this, you will need the node's local and world (!) matrices and they might need to be modified.

            // Get the node's world transformation and clone it to leave the original values intact in case we change it here
            let world_transformation = mat4.clone(node.getWorldTransformation())


            // Get the node's local transformation that we modify
            // Do not clone it since we WANT to modify this one
            let transformation = node.getTransformation()

            
            // TODO: Make any modifications or adaptions to the world matrix here and create any other needed variables

            // TODO: Apply the transformations (rotate, scale, translate) and any helper transformations in the correct order to 'transformation'   
            mat4.multiply(transformation, rotation, transformation);
            mat4.multiply(transformation, scale, transformation);
            mat4.multiply(transformation, translation, transformation);
            
             // Update the node's transformation
            node.setTransformation(transformation);
        }
    }
    /**
     * Main render loop which sets up the active viewport (i.e. the area of the canvas we draw to)
     * clears the canvas with a background color and draws the scene
     * 
     * @param {WebGL2RenderingContext} gl The webgl2 rendering context
     * @param {Number} canvas_width The canvas width. Needed to set the viewport
     * @param {Number} canvas_height The canvas height. Needed to set the viewport
     */
    
    render( gl, canvas_width, canvas_height )
    {
        // Set viewport and clear canvas
        this.setViewport( gl, canvas_width, canvas_height )
        this.clearCanvas( gl )

        // Render the box
        // This will use the MVP that was passed to the shader
        this.box.render( gl )

        // Render the scene
        if (this.scene) this.scene.render( gl )
    }
}

export {
    WebGlApp
}
