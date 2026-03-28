import { _decorator, Component, utils, primitives, MeshRenderer, Material, Node, math, Vec3, Mesh, Camera, director, CCInteger, CCFloat, Color } from 'cc';
import { darkenColor } from '../utils/ColorUtils';
const { ccclass, property } = _decorator;

@ccclass('CustomLineMesh')
export class CustomLineMesh extends Component
{
    // Ensure this mesh is updated in the editor
    static _executeInEditMode = true;
    
    @property(Material)
    material: Material | null = null;

    @property(MeshRenderer)
    meshRenderer: MeshRenderer | null = null;
    
    // Store mesh reference to update it later
    private dynamicMesh: Mesh | null = null;
    
    // For dynamic mesh updates
    @property
    updateInRealtime: boolean = false;
    
    // Animation properties
    @property
    animationSpeed: number = 1.0;
    
    // Custom points for mesh creation
    @property([Vec3])
    points: Vec3[] = [];
    
    // Line drawing properties
    @property
    lineWidth: number = 0.05;
    
    // Billboard properties
    @property
    enableBillboard: boolean = true;

    @property(Camera)
    targetCamera: Camera | null = null;
    
    // Rendering properties
    @property
    doubleSided: boolean = false;
    
    // Performance optimization properties
    @property 
    maxPoints: number = 100; // Pre-allocate for this many points

    @property({ type: CCInteger, tooltip: 'Updates per second (0 = every frame)' })
    updateFrequency: number = 60;

    private lastUpdateTime: number = 0;
    public isDirty: boolean = false;

    @property(CCFloat)
    public fillAmount : number = 1.0;

    onLoad()
    {
        // Ensure we have a MeshRenderer
        if (!this.meshRenderer) {
            this.meshRenderer = this.getComponent(MeshRenderer);
            if (!this.meshRenderer) {
                this.meshRenderer = this.addComponent(MeshRenderer);
            }
        }
    }

    protected start() : void
    {
        // Get the main camera if no target camera is set
        if (this.enableBillboard && !this.targetCamera) {
            const mainCamera = director.getScene()?.getComponentInChildren(Camera);
            if (mainCamera) {
                this.targetCamera = mainCamera;
            }
        }
        
        if (this.points.length > 0) {
            this.createLineMeshFromPoints();
        } else {
            this.createDynamicMesh();
        }

        this.setFill(this.fillAmount);
    }
    
    update(deltaTime: number)
    {
        if(!this.node.isValid) return
        if (this.enableBillboard && this.targetCamera) {
            this.updateBillboard();
        }
        
        // Handle throttled mesh updates for performance
        if (this.isDirty && this.shouldUpdateMesh(deltaTime)) {
            this.updateMeshData();
            this.isDirty = false;
        }
    }
    
    /**
     * Check if mesh should update based on frequency setting
     */
    private shouldUpdateMesh(deltaTime: number): boolean
    {
        if (this.updateFrequency <= 0) return true; // Update every frame
        
        this.lastUpdateTime += deltaTime;
        const updateInterval = 1.0 / this.updateFrequency;
        
        if (this.lastUpdateTime >= updateInterval) {
            this.lastUpdateTime = 0;
            return true;
        }
        return false;
    }
    
    /**
     * Efficiently update mesh data without recreating the entire mesh
     */
    private updateMeshData() {
        if (!this.dynamicMesh || this.points.length < 2) return;

        const positions: number[] = [];
        const indices: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];

        const lineWidth = this.lineWidth;

        for (let i = 0; i < this.points.length; i++) {
            const currentPoint = this.points[i];
            let direction = new Vec3(1, 0, 0);

            if (i < this.points.length - 1) {
                direction = Vec3.subtract(new Vec3(), this.points[i + 1], currentPoint).normalize();
            } else if (i > 0) {
                direction = Vec3.subtract(new Vec3(), currentPoint, this.points[i - 1]).normalize();
            }

            const perpendicular = new Vec3(-direction.y, direction.x, 0).normalize();
            const halfWidth = Vec3.multiplyScalar(new Vec3(), perpendicular, lineWidth);

            const leftPoint = Vec3.subtract(new Vec3(), currentPoint, halfWidth);
            const rightPoint = Vec3.add(new Vec3(), currentPoint, halfWidth);

            positions.push(
                leftPoint.x, leftPoint.y, leftPoint.z,
                rightPoint.x, rightPoint.y, rightPoint.z
            );

            normals.push(0, 0, 1, 0, 0, 1);

            const uvCoord = i / (this.points.length - 1);
            uvs.push(0, uvCoord, 1, uvCoord);

            if (i < this.points.length - 1) {
                const baseIndex = i * 2;
                indices.push(
                    baseIndex, baseIndex + 2, baseIndex + 1,
                    baseIndex + 1, baseIndex + 2, baseIndex + 3
                );
            }
        }

        // Update the submesh geometry incrementally
        this.dynamicMesh.updateSubMesh(0, {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            uvs: new Float32Array(uvs),
            indices16: new Uint16Array(indices),
        });

        // Notify the mesh renderer to update
        this.meshRenderer!.mesh = this.dynamicMesh;
    }
    
    /**
     * Mark mesh as needing update (call this when points change)
     */
    markDirty()
    {
        this.isDirty = true;
    }
    
    /**
     * Updates the node rotation to face the camera (billboard effect)
     */
    updateBillboard()
    {
        if (!this.targetCamera) return;
        
        // Get camera position
        const cameraPos = this.targetCamera.node.getWorldPosition();
        const nodePos = this.node.getWorldPosition();
        
        // Calculate direction from node to camera
        const direction = Vec3.subtract(new Vec3(), cameraPos, nodePos);
        direction.normalize();
        
        // Calculate rotation to face the camera
        // We want the mesh to face the camera, so we look in the direction of the camera
        const forward = new Vec3(0, 0, -1); // Default forward direction
        const up = new Vec3(0, 1, 0); // Up direction
        
        // Create a rotation that makes the forward vector point towards the camera
        const targetRotation = math.Quat.fromViewUp(new math.Quat(), direction, up);
        
        // Apply the rotation
        this.node.setWorldRotation(targetRotation);
    }
    
    /**
     * Creates a mesh from the custom points array
     */
    createMeshFromPoints()
    {
        if (this.points.length < 3) {
            console.warn('Need at least 3 points to create a mesh');
            this.createDynamicMesh(); // Fallback to default
            return;
        }

        // Convert Vec3 points to Float32Array positions
        const positions = new Float32Array(this.points.length * 3);
        for (let i = 0; i < this.points.length; i++) {
            positions[i * 3] = this.points[i].x;
            positions[i * 3 + 1] = this.points[i].y;
            positions[i * 3 + 2] = this.points[i].z;
        }

        // Create indices for triangulation (simple fan triangulation from first point)
        const indices: number[] = [];
        for (let i = 1; i < this.points.length - 1; i++) {
            indices.push(0, i, i + 1);
        }
        const indicesArray = new Uint16Array(indices);

        // Calculate normals (pointing towards camera)
        const normals = new Float32Array(this.points.length * 3);
        for (let i = 0; i < this.points.length; i++) {
            normals[i * 3] = 0;     // x
            normals[i * 3 + 1] = 0; // y
            normals[i * 3 + 2] = 1; // z (pointing towards camera)
        }

        // Generate UVs based on point positions (simple planar mapping)
        const uvs = new Float32Array(this.points.length * 2);
        let minX = this.points[0].x, maxX = this.points[0].x;
        let minY = this.points[0].y, maxY = this.points[0].y;
        
        // Find bounds
        for (let point of this.points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        // Map to UV coordinates
        for (let i = 0; i < this.points.length; i++) {
            uvs[i * 2] = (this.points[i].x - minX) / (maxX - minX || 1);
            uvs[i * 2 + 1] = (this.points[i].y - minY) / (maxY - minY || 1);
        }

        // Create the dynamic geometry
        const dynamicGeometry: primitives.IDynamicGeometry = {
            positions: positions,
            indices16: indicesArray,
            normals: normals,
            uvs: uvs
        };

        this.createMeshFromGeometry(dynamicGeometry);
    }
    
    /**
     * Helper method to create mesh from geometry data
     */
    createMeshFromGeometry(dynamicGeometry: primitives.IDynamicGeometry)
    {
        // Create the dynamic mesh with optimized options for frequent updates
        const options: primitives.ICreateDynamicMeshOptions = {
            maxSubMeshes: 1,
            maxSubMeshVertices: this.maxPoints * 4, // Extra vertices for polygon mode
            maxSubMeshIndices: this.maxPoints * 6   // 6 indices per segment
        };
        
        // Create the dynamic mesh - primitive index 0
        const primitiveIndex = 0;
        this.dynamicMesh = utils.MeshUtils.createDynamicMesh(primitiveIndex, dynamicGeometry, this.dynamicMesh, options);
        
        if (!this.dynamicMesh) {
            return;
        }
        
        // Ensure the MeshRenderer exists
        if (!this.meshRenderer) {
            return;
        }
        
        // Set up the MeshRenderer
        this.meshRenderer.mesh = this.dynamicMesh;
        
        // Apply material if available
        if (this.material) {
            this.meshRenderer.setSharedMaterial(this.material, 0);
        }
        
        // Ensure node is visible
        this.node.active = true;        
    }
    
    /**
     * Creates a dynamic mesh that can be updated later
     */
    createDynamicMesh()
    {
        // Create position data as Float32Array for dynamic mesh
        const positions = new Float32Array([
            -0.5, 0.5, 0,  // top-left
            -0.5, -0.5, 0, // bottom-left
            0.5, -0.5, 0,  // bottom-right
            0.5, 0.5, 0,   // top-right
        ]);
        
        // Create indices as Uint16Array
        const indices = new Uint16Array([
            0, 1, 2, // first triangle
            0, 2, 3  // second triangle
        ]);
        
        // Create normal data as Float32Array
        const normals = new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1
        ]);
        
        // Create UV data as Float32Array
        const uvs = new Float32Array([
            0, 0,
            0, 1,
            1, 1,
            1, 0
        ]);
        
        // Create a quad mesh as a dynamic geometry
        const dynamicGeometry: primitives.IDynamicGeometry = {
            positions: positions,
            indices16: indices, // Use indices16 for Uint16Array
            normals: normals,
            uvs: uvs
        };

        // Create the dynamic mesh with optimized options for frequent updates
        const options: primitives.ICreateDynamicMeshOptions = {
            maxSubMeshes: 1,
            maxSubMeshVertices: this.maxPoints * 2, // 2 vertices per point for quad
            maxSubMeshIndices: this.maxPoints * 6   // 6 indices per quad (2 triangles)
        };
        
        
        // Create the dynamic mesh - primitive index 0
        const primitiveIndex = 0; // First primitive
        this.dynamicMesh = utils.MeshUtils.createDynamicMesh(primitiveIndex, dynamicGeometry, this.dynamicMesh, options);
        
        if (!this.dynamicMesh)
        {
            return;
        }
        
        // Ensure the MeshRenderer exists
        if (!this.meshRenderer)
        {
            return;
        }
        
        // Set up the MeshRenderer
        this.meshRenderer.mesh = this.dynamicMesh;
        
        // Apply material if available
        if (this.material)
        {
            this.meshRenderer.setSharedMaterial(this.material, 0);
        }
        
        // Ensure node is visible
        this.node.active = true;
        
      
    }
    
    /**
     * Set points from an array of coordinates
     * @param points Array of [x, y, z] coordinates
     */
    setPointsFromArray(points: number[][])
    {
        this.points = points.map(p => new Vec3(p[0], p[1], p[2] || 0));
        this.createMeshFromPoints();
    }
    
    /**
     * Set points from Vec3 array (optimized for runtime updates)
     * @param points Array of Vec3 points
     * @param immediate Whether to update immediately or wait for next update cycle
     */
    setPointsFromVec3Array(points: Vec3[], immediate: boolean = false)
    {
        this.points = [...points];
        if (immediate) {
            this.createLineMeshFromPoints();
        } else {
            this.markDirty();
        }
    }
    
    /**
     * Draw a line from coordinate arrays (optimized for runtime updates)
     * @param points Array of [x, y, z] coordinates
     * @param width Optional line width override
     * @param immediate Whether to update immediately or wait for next update cycle
     */
    drawLineFromArray(points: number[][], width?: number, immediate: boolean = false)
    {
        if (width !== undefined) {
            this.lineWidth = width;
        }
        this.points = points.map(p => new Vec3(p[0], p[1], p[2] || 0));
        if (immediate) {
            this.createLineMeshFromPoints();
        } else {
            this.markDirty();
        }
    }
    
    /**
     * Draw a line from Vec3 points (optimized for runtime updates)
     * @param points Array of Vec3 points
     * @param width Optional line width override
     * @param immediate Whether to update immediately or wait for next update cycle
     */
    drawLineFromVec3Array(points: Vec3[], width?: number, immediate: boolean = false)
    {
        if (width !== undefined) {
            this.lineWidth = width;
        }
        this.points = [...points];
        if (immediate) {
            this.createLineMeshFromPoints();
        } else {
            this.markDirty();
        }
    }
    
    /**
     * Add a point to the line (for growing lines)
     * @param point New point to add
     * @param immediate Whether to update mesh immediately
     */
    addPoint(point: Vec3, immediate: boolean = false) {
        this.points.push(point);

        if (immediate) {
            if (this.dynamicMesh) {
                const positions: number[] = [];
                const indices: number[] = [];
                const normals: number[] = [];
                const uvs: number[] = [];

                const lineWidth = this.lineWidth;

                for (let i = 0; i < this.points.length; i++) {
                    const currentPoint = this.points[i];
                    let direction = new Vec3(1, 0, 0);

                    if (i < this.points.length - 1) {
                        direction = Vec3.subtract(new Vec3(), this.points[i + 1], currentPoint).normalize();
                    } else if (i > 0) {
                        direction = Vec3.subtract(new Vec3(), currentPoint, this.points[i - 1]).normalize();
                    }

                    const perpendicular = new Vec3(-direction.y, direction.x, 0).normalize();
                    const halfWidth = Vec3.multiplyScalar(new Vec3(), perpendicular, lineWidth);

                    const leftPoint = Vec3.subtract(new Vec3(), currentPoint, halfWidth);
                    const rightPoint = Vec3.add(new Vec3(), currentPoint, halfWidth);

                    positions.push(
                        leftPoint.x, leftPoint.y, leftPoint.z,
                        rightPoint.x, rightPoint.y, rightPoint.z
                    );

                    normals.push(0, 0, 1, 0, 0, 1);

                    const uvCoord = i / (this.points.length - 1);
                    uvs.push(0, uvCoord, 1, uvCoord);

                    if (i < this.points.length - 1) {
                        const baseIndex = i * 2;
                        indices.push(
                            baseIndex, baseIndex + 2, baseIndex + 1,
                            baseIndex + 1, baseIndex + 2, baseIndex + 3
                        );
                    }
                }

                // Update the submesh geometry incrementally
                this.dynamicMesh.updateSubMesh(0, {
                    positions: new Float32Array(positions),
                    normals: new Float32Array(normals),
                    uvs: new Float32Array(uvs),
                    indices16: new Uint16Array(indices),
                });

                // Notify the mesh renderer to update
                this.meshRenderer!.mesh = this.dynamicMesh;
            } else {
                this.createLineMeshFromPoints();
            }
        } else {
            this.markDirty();
        }
    }

    /**
     * Remove a point by index (for shrinking lines)
     * @param index Index of the point to remove
     * @param immediate Whether to update mesh immediately
     */
    removePoint(index: number, immediate: boolean = false) {
        if (index >= 0 && index < this.points.length) {
            this.points.splice(index, 1);
            if (immediate) {
                if (this.dynamicMesh) {
                    const positions: number[] = [];
                    const indices: number[] = [];
                    const normals: number[] = [];
                    const uvs: number[] = [];

                    const lineWidth = this.lineWidth;

                    for (let i = 0; i < this.points.length; i++) {
                        const currentPoint = this.points[i];
                        let direction = new Vec3(1, 0, 0);

                        if (i < this.points.length - 1) {
                            direction = Vec3.subtract(new Vec3(), this.points[i + 1], currentPoint).normalize();
                        } else if (i > 0) {
                            direction = Vec3.subtract(new Vec3(), currentPoint, this.points[i - 1]).normalize();
                        }

                        const perpendicular = new Vec3(-direction.y, direction.x, 0).normalize();
                        const halfWidth = Vec3.multiplyScalar(new Vec3(), perpendicular, lineWidth);

                        const leftPoint = Vec3.subtract(new Vec3(), currentPoint, halfWidth);
                        const rightPoint = Vec3.add(new Vec3(), currentPoint, halfWidth);

                        positions.push(
                            leftPoint.x, leftPoint.y, leftPoint.z,
                            rightPoint.x, rightPoint.y, rightPoint.z
                        );

                        normals.push(0, 0, 1, 0, 0, 1);

                        const uvCoord = i / (this.points.length - 1);
                        uvs.push(0, uvCoord, 1, uvCoord);

                        if (i < this.points.length - 1) {
                            const baseIndex = i * 2;
                            indices.push(
                                baseIndex, baseIndex + 2, baseIndex + 1,
                                baseIndex + 1, baseIndex + 2, baseIndex + 3
                            );
                        }
                    }

                    // Update the submesh geometry incrementally
                    this.dynamicMesh.updateSubMesh(0, {
                        positions: new Float32Array(positions),
                        normals: new Float32Array(normals),
                        uvs: new Float32Array(uvs),
                        indices16: new Uint16Array(indices),
                    });

                    // Notify the mesh renderer to update
                    this.meshRenderer!.mesh = this.dynamicMesh;
                } else {
                    this.createLineMeshFromPoints();
                }
            } else {
                this.markDirty();
            }
        } else {
            console.warn('Index out of bounds for removing point');
        }
    }
    
    /**
     * Update a specific point (for animating individual points)
     * @param index Point index to update
     * @param newPoint New position
     * @param immediate Whether to update mesh immediately
     */
    updatePoint(index: number, newPoint: Vec3, immediate: boolean = false) {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = newPoint;
            if (immediate) {
                if (this.dynamicMesh) {
                    const positions: number[] = [];
                    const indices: number[] = [];
                    const normals: number[] = [];
                    const uvs: number[] = [];

                    const lineWidth = this.lineWidth;

                    for (let i = 0; i < this.points.length; i++) {
                        const currentPoint = this.points[i];
                        let direction = new Vec3(1, 0, 0);

                        if (i < this.points.length - 1) {
                            direction = Vec3.subtract(new Vec3(), this.points[i + 1], currentPoint).normalize();
                        } else if (i > 0) {
                            direction = Vec3.subtract(new Vec3(), currentPoint, this.points[i - 1]).normalize();
                        }

                        const perpendicular = new Vec3(-direction.y, direction.x, 0).normalize();
                        const halfWidth = Vec3.multiplyScalar(new Vec3(), perpendicular, lineWidth);

                        const leftPoint = Vec3.subtract(new Vec3(), currentPoint, halfWidth);
                        const rightPoint = Vec3.add(new Vec3(), currentPoint, halfWidth);

                        positions.push(
                            leftPoint.x, leftPoint.y, leftPoint.z,
                            rightPoint.x, rightPoint.y, rightPoint.z
                        );

                        normals.push(0, 0, 1, 0, 0, 1);

                        const uvCoord = i / (this.points.length - 1);
                        uvs.push(0, uvCoord, 1, uvCoord);

                        if (i < this.points.length - 1) {
                            const baseIndex = i * 2;
                            indices.push(
                                baseIndex, baseIndex + 2, baseIndex + 1,
                                baseIndex + 1, baseIndex + 2, baseIndex + 3
                            );
                        }
                    }

                    // Update the submesh geometry incrementally
                    this.dynamicMesh.updateSubMesh(0, {
                        positions: new Float32Array(positions),
                        normals: new Float32Array(normals),
                        uvs: new Float32Array(uvs),
                        indices16: new Uint16Array(indices),
                    });

                    // Notify the mesh renderer to update
                    this.meshRenderer!.mesh = this.dynamicMesh;
                } else {
                    this.createLineMeshFromPoints();
                }
            } else {
                this.markDirty();
            }
        }
    }

    /**
     * Update a specific point (for animating individual points)
     * @param index Point index to update
     * @param x New position x
     * @param y New position y
     * @param z New position z
     * @param immediate Whether to update mesh immediately
     */
    updatePointXYZ(index: number, x: number, y: number, z: number, immediate: boolean = false) {
        if (index >= 0 && index < this.points.length) {
            this.points[index].x = x;
            this.points[index].y = y;
            this.points[index].z = z;
            if (immediate) {
                if (this.dynamicMesh) {
                    const positions: number[] = [];
                    const indices: number[] = [];
                    const normals: number[] = [];
                    const uvs: number[] = [];

                    const lineWidth = this.lineWidth;

                    for (let i = 0; i < this.points.length; i++) {
                        const currentPoint = this.points[i];
                        let direction = new Vec3(1, 0, 0);

                        if (i < this.points.length - 1) {
                            direction = Vec3.subtract(new Vec3(), this.points[i + 1], currentPoint).normalize();
                        } else if (i > 0) {
                            direction = Vec3.subtract(new Vec3(), currentPoint, this.points[i - 1]).normalize();
                        }

                        const perpendicular = new Vec3(-direction.y, direction.x, 0).normalize();
                        const halfWidth = Vec3.multiplyScalar(new Vec3(), perpendicular, lineWidth);

                        const leftPoint = Vec3.subtract(new Vec3(), currentPoint, halfWidth);
                        const rightPoint = Vec3.add(new Vec3(), currentPoint, halfWidth);

                        positions.push(
                            leftPoint.x, leftPoint.y, leftPoint.z,
                            rightPoint.x, rightPoint.y, rightPoint.z
                        );

                        normals.push(0, 0, 1, 0, 0, 1);

                        const uvCoord = i / (this.points.length - 1);
                        uvs.push(0, uvCoord, 1, uvCoord);

                        if (i < this.points.length - 1) {
                            const baseIndex = i * 2;
                            indices.push(
                                baseIndex, baseIndex + 2, baseIndex + 1,
                                baseIndex + 1, baseIndex + 2, baseIndex + 3
                            );
                        }
                    }

                    // Update the submesh geometry incrementally
                    this.dynamicMesh.updateSubMesh(0, {
                        positions: new Float32Array(positions),
                        normals: new Float32Array(normals),
                        uvs: new Float32Array(uvs),
                        indices16: new Uint16Array(indices),
                    });

                    // Notify the mesh renderer to update
                    this.meshRenderer!.mesh = this.dynamicMesh;
                } else {
                    this.createLineMeshFromPoints();
                }
            } else {
                this.markDirty();
            }
        }
    }
    
    /**
     * Clear all points
     * @param immediate Whether to update mesh immediately
     */
    clearPoints(immediate: boolean = true)
    {
        this.points = [];
        if (immediate) {
            // Clear the mesh by creating an empty one or hiding it
            if (this.meshRenderer) {
                this.meshRenderer.mesh = null;
            }
        } else {
            this.markDirty();
        }
    }
    
    /**
     * Create a line mesh from points (creates a strip)
     */
    createLineMeshFromPoints()
    {
        if (this.points.length < 2) {
            // console.warn('Need at least 2 points to create a line');
            // Clear the mesh if there are insufficient points
            if (this.meshRenderer) {
                this.meshRenderer.mesh = null;
            }
            return;
        }

        const positions: number[] = [];
        const indices: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        
        const lineWidth = this.lineWidth; // Use the configurable line width
        
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            
            // For each point, create a small quad perpendicular to the line direction
            let direction = new Vec3(1, 0, 0); // Default direction
            
            if (i < this.points.length - 1) {
                // Calculate direction to next point
                direction = Vec3.subtract(new Vec3(), this.points[i + 1], point).normalize();
            } else if (i > 0) {
                // For last point, use direction from previous point
                direction = Vec3.subtract(new Vec3(), point, this.points[i - 1]).normalize();
            }
            
            // Create perpendicular vector for line width
            const perpendicular = new Vec3(-direction.y, direction.x, 0).normalize();
            const halfWidth = Vec3.multiplyScalar(new Vec3(), perpendicular, lineWidth);
            
            // Create 2 vertices per point (left and right of the line)
            const leftPoint = Vec3.subtract(new Vec3(), point, halfWidth);
            const rightPoint = Vec3.add(new Vec3(), point, halfWidth);
            
            positions.push(
                leftPoint.x, leftPoint.y, leftPoint.z,
                rightPoint.x, rightPoint.y, rightPoint.z
            );
            
            // Add normals (pointing towards camera/forward)
            normals.push(0, 0, 1, 0, 0, 1);
            
            // Calculate UV coordinates for proper tiling per segment
            let uvCoord = 0;
            if (i > 0) {
                // Calculate cumulative distance along the line for proper UV mapping
                let cumulativeDistance = 0;
                for (let j = 1; j <= i; j++) {
                    const segmentDistance = Vec3.distance(this.points[j], this.points[j - 1]);
                    cumulativeDistance += segmentDistance;
                }
                // Normalize by line width to get proper tiling
                uvCoord = cumulativeDistance / lineWidth;
            }
            uvs.push(0, uvCoord, 1, uvCoord);
            
            // Create triangles for line segments
            if (i < this.points.length - 1) {
                const baseIndex = i * 2;
                // Create quad between current and next point with correct winding order (counter-clockwise)
                indices.push(
                    baseIndex, baseIndex + 2, baseIndex + 1,     // First triangle
                    baseIndex + 1, baseIndex + 2, baseIndex + 3  // Second triangle
                );
            }
        }

        const dynamicGeometry: primitives.IDynamicGeometry = {
            positions: new Float32Array(positions),
            indices16: new Uint16Array(indices),
            normals: new Float32Array(normals),
            uvs: new Float32Array(uvs)
        };

        this.createMeshFromGeometry(dynamicGeometry);
        
        // Handle double-sided rendering
        if (this.doubleSided && this.meshRenderer) {
            // Enable double-sided rendering in the material
            this.scheduleOnce(() => {
                if (this.meshRenderer && this.meshRenderer.material) {
                    const material = this.meshRenderer.material;
                    material.setProperty('cullMode', 0); // Disable culling for double-sided
                }
            }, 0);
        }        
    }
    
    /**
     * Enable or disable billboard behavior
     * @param enabled Whether to enable billboard
     * @param camera Optional camera to use for billboard
     */
    setBillboardEnabled(enabled: boolean, camera?: Camera)
    {
        this.enableBillboard = enabled;
        if (camera) {
            this.targetCamera = camera;
        }
        
        if (!enabled) {
            // Reset rotation when disabling billboard
            this.node.setRotation(0, 0, 0, 1);
        }
    }
    
    /**
     * Set the camera for billboard behavior
     * @param camera The camera to face towards
     */
    setBillboardCamera(camera: Camera)
    {
        this.targetCamera = camera;
    }

    onDestroy()
    {
        this.cleanup();
    }
    
    /**
     * Cleanup resources to prevent memory leaks
     */
    private cleanup()
    {
        if (this.meshRenderer) {
            this.meshRenderer.mesh = null;
        }
        this.dynamicMesh?.destroy();
    }


    public updateRenderPoints(points: Vec3[])
    {
        if (this.points.length != points.length)
        {
            this.cleanup();
            this.clearPoints(true)
            this.maxPoints = points.length;
            for (const p of points)
            {
                this.addPoint(p);
            }
            return;
        }
        for (let i = 0; i < points.length; i++)
        {
            this.updatePointXYZ(i, points[i].x, points[i].y, points[i].z, false);
        }
    }

    /**
     * @en
     * Set the fill amount for the line mesh.
     * @param fill The fill amount (0 to 2).
     * 0 to 1 is from the end to start point.
     * 1 to 2 is from the start to end point.
     */
    public setFill(fill: number)
    {
        if (this.fillAmount != fill)
        {
            const mat = this.meshRenderer.getMaterialInstance(0);
            mat.setProperty('fill', fill);
            this.fillAmount = fill;
        }
    }

    public setColor(color: Color)
    {
        this.meshRenderer.getMaterialInstance(0).setProperty('mainColor', color);
        const shadow = darkenColor(color, 0.5);
        this.meshRenderer.getMaterialInstance(0).setProperty('shadowColor', shadow);
    }
}