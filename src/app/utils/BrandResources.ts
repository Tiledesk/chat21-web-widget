import { Injectable } from "@angular/core";
import { BrandService } from "../providers/brand.service";
import { BRAND_BASE_INFO, LOGOS_ITEMS } from "./utils-resources";

@Injectable({
    providedIn: 'root'
})
export class BrandResources {
    
    brand: {}
    
    constructor(
        brandService: BrandService
    ) {
        this.brand = brandService.getBrand()
    }

    loadResources(){
        if(!this.brand){
            return;
        }

        /** META TITLE and FAVICON */
        document.title = this.brand['BRAND_NAME'] + ' ' + this.brand['META_TITLE']
        // var icon = document.querySelector("link[rel~='icon']") as HTMLElement;
        // icon.setAttribute('href', this.brand['FAVICON_URL'])

        /** META sharing ELEMENTS */
        if(this.brand['META_SHARE_INFO'] && this.brand['META_SHARE_INFO'].length > 0){
            Object.keys(this.brand['META_SHARE_INFO']).forEach(key => {
                var meta = document.querySelector("meta[property^='og:"+key.toLowerCase()+"']") as HTMLElement;
                meta.setAttribute('content', this.brand['META_SHARE_INFO'][key])
            })
        }
        
        /** CSS */
        document.documentElement.style.setProperty('--base-brand-color', this.brand['BRAND_PRIMARY_COLOR']);

        /** BRAND_BASE_INFO */
        Object.keys(BRAND_BASE_INFO).forEach(key => BRAND_BASE_INFO[key] = this.brand[key])

        /** LOGOS_ITEMS */
        Object.keys(LOGOS_ITEMS).forEach(key => { LOGOS_ITEMS[key].icon = this.brand[key] })
        
    }
}