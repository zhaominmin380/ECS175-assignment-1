import { loadExternalFile } from './js/utils/utils.js'

/**
 * A class to load OBJ files from disk
 */
class OBJLoader {

    /**
     * Constructs the loader
     * 
     * @param {String} filename The full path to the model OBJ file on disk
     */
    constructor(filename) {
        this.filename = filename
    }

    /**
     * Loads the file from disk and parses the geometry
     * 
     * @returns {[Array<Number>, Array<Number>]} A tuple / list containing 1) the list of vertices and 2) the list of triangle indices
     */
    load() {
        // Load the file's contents
        let contents = loadExternalFile(this.filename)

        // Create lists for vertices and indices
        let vertices = []
        let indices = []

        // TODO: STEP 1
        // Parse the file's contents
        // You can loop through the file line-by-line by splitting the string at line breaks
        // contents.split('\n')
        let lines = contents.split('\n')

        // track min/max
        let minExtent = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]
        let maxExtent = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE]

        // TODO: STEP 2
        // Process (or skip) each line based on its content and call the parsing functions to parse an entry
        // For vertices call OBJLoader.parseVertex
        // For faces call OBJLoader.parseFace
        for (let line of lines) {
            line = line.trim()
            if (line.startsWith('v ')) {
                let vertex = this.parseVertex(line)
                vertices.push(vertex)

                for (let i = 0; i < 3; i++) {
                    minExtent[i] = Math.min(minExtent[i], vertex[i])
                    maxExtent[i] = Math.max(maxExtent[i], vertex[i])
                }
            } else if (line.startsWith('f ')) {
                let faceIndices = this.parseFace(line)
                indices.push(...faceIndices)
            }
        }

        // TODO: STEP 3
        // Vertex coordinates can be arbitrarily large or small
        // We want to normalize the vertex coordinates to fit within our [-1.0, 1.0]^3 box from the previous assignment
        // As a pre-processing step and to avoid complicated scaling transformations in the main app we perform normalization here
        // Determine the max and min extent of all the vertex coordinates and normalize each entry based on this finding
        let scale = 2.0 / Math.max(maxExtent[0] - minExtent[0], maxExtent[1] - minExtent[1], maxExtent[2] - minExtent[2])
        let offset = [
            -(maxExtent[0] + minExtent[0]) / 2,
            -(maxExtent[1] + minExtent[1]) / 2,
            -(maxExtent[2] + minExtent[2]) / 2,
        ]

        for (let i = 0; i < vertices.length; i++) {
            for (let j = 0; j < 3; j++) {
                vertices[i][j] = (vertices[i][j] + offset[j]) * scale
            }
        }
        // TODO: HINT
        // Look up the JavaScript functions String.split, parseFloat, and parseInt 
        // You will need thim in your parsing functions

        // Return the tuple
        return [vertices.flat(), indices]
    }

    /**
     * Parses a single OBJ vertex entry given as a string
     * Call this function from OBJLoader.load()
     * 
     * @param {String} vertex_string String containing the vertex entry 'v {x} {y} {z}'
     * @returns {Array<Number>} A list containing the x, y, z coordinates of the vertex
     */
    parseVertex(vertex_string) {
        // TODO: Process the entry and parse numbers to float
        let parts = vertex_string.split(/\s+/)
        let x = parseFloat(parts[1])
        let y = parseFloat(parts[2])
        let z = parseFloat(parts[3])
        return [x, y, z]
    }

    /**
     * Parses a single OBJ face entry given as a string
     * Face entries can refer to 3 or 4 elements making them triangle or quad faces
     * WebGL only supports triangle drawing, so we need to triangulate the entry if we find 4 indices
     * This is done using OBJLoader.triangulateFace()
     * 
     * Each index entry can have up to three components separated by '/' 
     * You need to grab the first component. The other ones are for textures and normals which will be treated later
     * Make sure to account for this fact.
     * 
     * Call this function from OBJLoader.load()
     * 
     * @param {String} face_string String containing the face entry 'f {v0}/{vt0}/{vn0} {v1}/{vt1}/{vn1} {v2}/{vt2}/{vn2} ({v3}/{vt3}/{vn3})'
     * @returns {Array<Number>} A list containing three indices defining a triangle
     */
    parseFace(face_string) {
        let parts = face_string.split(/\s+/).slice(1) // Ignore the 'f' part

        // TODO: Process the entry and parse numbers to ints
        // TODO: Don't forget to handle triangulation if quads are given
        let indices = parts.map(part => parseInt(part.split('/')[0]) - 1)

        if (indices.length === 3) {
            // Triangle face
            return indices
        } else if (indices.length === 4) {
            // Quad face
            return this.triangulateFace(indices)
        }

        throw "Wrong face format"
    }

    /**
     * Triangulates a face entry given as a list of 4 indices
     * Use these 4 indices to create indices for two separate triangles that share a side (2 vertices)
     * Return a new index list containing the triangulated indices
     * 
     * @param {Array<Number>} face The quad indices with 4 entries
     * @returns {Array<Number>} The newly created list containing triangulated indices
     */
    triangulateFace(face) {
        // TODO: Triangulate the face indices
        return [face[0], face[1], face[2], face[0], face[2], face[3]]
    }
}

export {
    OBJLoader
}
