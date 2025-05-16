import { LogLevel } from './../../utils/constants';
import { Inject, Injectable } from '@angular/core';
import { LoggerService } from './../abstract/logger.service';
import { NGXLogger } from 'ngx-logger';
@Injectable()
export class CustomLogger extends LoggerService{
    
    
    //private variables
    private logLevel: number = LogLevel.ERROR
    private isLogEnabled: boolean = true;
    
    constructor(private logger: NGXLogger) {
        super();
    }

    setLoggerConfig(isLogEnabled: boolean, logLevel: string){
        this.isLogEnabled = isLogEnabled;
        if (typeof logLevel === 'string') {
            this.logLevel = LogLevel[logLevel.toUpperCase()];
        } else {
            console.error('logLevel is not a string. See the chat21-ionic README.md')
        }
    }

    getLoggerConfig(): {isLogEnabled: boolean, logLevel: number}{
        return {isLogEnabled: this.isLogEnabled, logLevel: this.logLevel}
    }

    error(message: any, ...optionalParams: any[]) {
        if (this.isLogEnabled && this.logLevel >= LogLevel.ERROR) {
            this.logger.error(message, ...optionalParams)
            // console.log(message, ...optionalParams)
        }
    }

    warn(message: any, ...optionalParams: any[]) {
        if (this.isLogEnabled && this.logLevel >= LogLevel.WARN) {
            this.logger.warn(message, ...optionalParams)
            // console.log(message, ...optionalParams)
        }
    }

    info(message: any, ...optionalParams: any[]) {
        if (this.isLogEnabled && this.logLevel >= LogLevel.INFO) {
            this.logger.info(message, ...optionalParams)
            // console.log(message, ...optionalParams)
        }
    }

    debug(message: any, ...optionalParams: any[]) {
        if (this.isLogEnabled && this.logLevel >= LogLevel.DEBUG) {
            this.logger.debug(message, ...optionalParams)
            // console.debug(message, ...optionalParams)
        }
    }

    log(message: any, ...optionalParams: any[]) {
        if (this.isLogEnabled && this.logLevel >= LogLevel.DEBUG) {
            this.logger.log(message, ...optionalParams)
            // console.log(message, ...optionalParams);
        }
    }

}