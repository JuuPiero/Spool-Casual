import { _decorator, Component, Node } from 'cc';
import { GameConfig } from './GameConfigSA';
import { ServiceLocator } from '../ServiceLocator';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(GameConfig)
    public gameConfig: GameConfig;

    protected onLoad(): void {
        if(this.gameConfig) {
            ServiceLocator.register(GameConfig, this.gameConfig)
        }
    }
}


