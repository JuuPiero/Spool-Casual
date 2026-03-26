import { _decorator, Component, Node, sys } from 'cc';
import { GameConfig } from './GameConfigSA';
import { ServiceLocator } from '../ServiceLocator';
import { LevelData } from './LevelData';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
import { NavigationContainer } from '../Navigation/NavigationContainer';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(GameConfig)
    public gameConfig: GameConfig;

    @property(LevelData)
    public currentLevelData: LevelData

    protected onLoad(): void {
        if(this.gameConfig) {
            ServiceLocator.register(GameConfig, this.gameConfig)
            ServiceLocator.register(GameManager, this)
        }

        EventBus.on(GameEvent.LEVEL_COMPLETED, this.installGame)
    }

    installGame = () => {
        sys.openURL(this.gameConfig.storeUrl)
         ServiceLocator.get(NavigationContainer).stack.navigate('EndgameScreen')
    }
}
