import { Inject, Injectable } from '@angular/core';
import { LogLevel } from '../../utils/constants';
import { LoggerService } from './../abstract/logger.service';
@Injectable()
export class CustomLogger extends LoggerService{
    
    
    //private variables
    //private logger: NGXLogger

    constructor(@Inject('isLogEnabled') private isLogEnabled: boolean, private logLevel: number ) {
        super();
    }

    printLog(...message: any[]) {
        if (this.isLogEnabled && this.logLevel <= LogLevel.All) {
            console.log(message)
        }
    }
    printDebug(...message: any[]) {
        if (this.isLogEnabled && this.logLevel <= LogLevel.Debug) {
            console.debug(message)
        }
    }
    printWarn(...message: any[]) {
        if (this.isLogEnabled && this.logLevel <= LogLevel.Warn) {
            console.warn(message)
        }
    }
    printInfo(...message: any[]) {
        if (this.isLogEnabled && this.logLevel <= LogLevel.Info) {
            console.info(message)
        }
    }
    printError(...message: any[]) {
        if(this.isLogEnabled && this.logLevel <= LogLevel.Error){
            console.error(message)
        }
    }

}