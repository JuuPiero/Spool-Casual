import { _decorator, Component, Node, Vec3, Quat, instantiate, Prefab, MeshRenderer, Mesh, utils } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DebugDraw3D')
export class DebugDraw3D extends Component {

    @property(MeshRenderer)
    meshRenderer: MeshRenderer = null!;

    private mesh: Mesh | null = null;

    onLoad() {
        this.mesh = new Mesh();
        this.meshRenderer.mesh = this.mesh;
    }

    // =========================
    // DRAW LINE STRIP
    // =========================
    public draw(points: Vec3[]) {
        if (points.length < 2) return;

        const positions: number[] = [];

        for (let i = 0; i < points.length; i++) {
            positions.push(points[i].x, points[i].y, points[i].z);
        }

        // tạo mesh dạng line strip
        const meshStruct = {
            positions: new Float32Array(positions),
        };

        
    }
}