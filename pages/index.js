import React, { Component } from 'react';
import MobileDetect from 'mobile-detect';
import {Statistic, Divider, Grid, Responsive, Table, Message} from 'semantic-ui-react';
import { ethers } from 'ethers';
import factory from '../ethereum/factory';
import Rental from '../ethereum/rental';
import Profile from '../ethereum/profile';
import Layout from '../components/Layout';
import { getWidthFactory } from '../utils/device';
import { convertToImage } from '../utils/ipfs';
import { Link, Router } from '../routes';
import RentalShow from './rents/show';
import moment from 'moment';

class RentalIndex extends Component {

    static async getInitialProps({ req }) { 
        
        const deployedRents = await factory.methods.getDeployedRentals().call();
        const status = await Promise.all(
                deployedRents
                .map((address) => {
                return Rental(address).methods.getState().call();
            })
        );

        const availableRents = deployedRents.filter((address, i) => 
            status[i] == "PUBLISHED"
        );

        availableRents.reverse();

        let names = [];
        let owners = [];
        let deposit = [];
        let rentalFee = [];

        const summary = await Promise.all(
                availableRents
                .map((address) => {
                    return Rental(address).methods.getSummary().call();
                })  
        );
        
        summary.forEach(function(item){
            names.push(item[0]);
            owners.push(item[5]);
            deposit.push(item[3]);
            rentalFee.push(item[2]);

        });

        const timeArray = await Promise.all(
            availableRents.map((address)=>{
                return Rental(address).methods.getTime().call();
            })
        );

        // const deposit2 = await Promise.all(
        //         availableRents
        //         .map((address) => {
        //         return Rental(address).methods.deposit().call();;
        //     })
        // );

        
        const ownersP = await Promise.all(
                owners
                .map((owner) => {
                return factory.methods.getProfile(owner).call();;
            })
        );

        const itemSumRatings = await Promise.all(
                ownersP
                .map((ownerP) => {
                return Profile(ownerP).methods.getSumRating().call();;
            })
        );

        const ratingCounts = await Promise.all(
                ownersP
                .map((ownerP) => {
                return Profile(ownerP).methods.ratingCounts().call();;
            })
        );

        const imageHashes = await Promise.all(
                availableRents
                .map((address) => {
                return Rental(address).methods.imageHashes().call();
            })
        );

        const images = await Promise.all(
                imageHashes
                .map((hash) => {
                return hash == '0' ? 
                    'https://react.semantic-ui.com/images/wireframe/white-image.png' 
                    : convertToImage('Qm' + hash);
            })
        );

        let isMobileFromSSR = false;

        if(req){
            const device = req.headers["user-agent"];
            const md = new MobileDetect(device);
            isMobileFromSSR = !!md.mobile();
        }

        return { deployedRents, availableRents, names, deposit, rentalFee, imageHashes, 
                images, isMobileFromSSR, itemSumRatings, ratingCounts, timeArray };
    }

    renderRentsDesktop() {
        const items = this.props.availableRents.map((address, i) => {
            const deposit = ethers.utils.formatUnits(this.props.deposit[i], "ether");
            //const feeHour = (ethers.utils.formatUnits(this.props.rentalFee[i], "ether") * 60 * 60).toFixed(4);
            const rating = this.props.ratingCounts[i];
            const time = this.props.timeArray[i];
            console.log(time);
            const timeEnd = moment.unix(time[0]).format('dddd, Do MMMM YYYY, h:mm:ss a');
            return <Table.Row key={i}>
                <Table.Cell textAlign='center' width={2} onClick={() => Router.pushRoute(`/rents/${address}`)} style={{cursor: 'pointer'}}>
                    <div style={{border: 'solid 0.5px green', borderRadius: '4px'}}>
                    <Statistic size='mini' color='red'>
                        <Statistic.Value><span style={{fontSize: 15, color: '#6A737C'}}>{rating}</span></Statistic.Value>
                        <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>votes</span></Statistic.Label>
                    </Statistic>
                    </div>
                </Table.Cell>
                <Table.Cell textAlign='center' width={2} onClick={() => Router.pushRoute(`/rents/${address}`)} style={{cursor: 'pointer'}}>
                    <Statistic size='mini' color='red'>
                        <Statistic.Value><span style={{fontSize: 15, color: '#6A737C'}}>0</span></Statistic.Value>
                        <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>answers</span></Statistic.Label>
                    </Statistic>
                </Table.Cell>
                <Table.Cell textAlign='center' width={2} onClick={() => Router.pushRoute(`/rents/${address}`)} style={{cursor: 'pointer'}}>
                    <Statistic size='mini' color='red'>
                        <Statistic.Value><span style={{fontSize: 15, color: '#6A737C'}}>{deposit}</span></Statistic.Value>
                        <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>ethers</span></Statistic.Label>
                    </Statistic>
                </Table.Cell>
                <Table.Cell textAlign='left' onClick={() => Router.pushRoute(`/rents/${address}`)} style={{cursor: 'pointer'}}>
                    <Grid.Row textAlign='left'>
                        <span style={{fontSize: 18, color: '#6A737C'}}><a>{this.props.names[i]}</a></span></Grid.Row>
                    <Grid.Row textAlign='right'>
                        <Message color='yellow' compact size='mini'
                            header={'End time: '+timeEnd}
                        />
                    </Grid.Row>
                </Table.Cell> 
            </Table.Row>
        });

        return  <Table>
            <Table.Body>
                {items}
            </Table.Body>
        </Table>
    }

    renderRentsMobile() {
        const items = this.props.availableRents.map((address, i) => {
            const deposit = ethers.utils.formatUnits(this.props.deposit[i], "ether");
            //const feeHour = (ethers.utils.formatUnits(this.props.rentalFee[i], "ether") * 60 * 60).toFixed(4);
            const rating = this.props.ratingCounts[i];
            return <Table fixed>
            <Table.Body>
            <Table.Row>
                <Table.Cell textAlign='center' width={2}>
                    <Statistic size='mini' color='red'>
                        <Statistic.Value><span style={{fontSize: 15, color: '#6A737C'}}>{rating}</span></Statistic.Value>
                        <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>votes</span></Statistic.Label>
                    </Statistic>
                </Table.Cell>
                <Table.Cell textAlign='center' width={2}>
                    <Statistic size='mini' color='red'>
                        <Statistic.Value><span style={{fontSize: 15, color: '#6A737C'}}>0</span></Statistic.Value>
                        <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>answers</span></Statistic.Label>
                    </Statistic>
                </Table.Cell>
                <Table.Cell textAlign='center' width={2}>
                    <Statistic size='mini' color='red'>
                        <Statistic.Value><span style={{fontSize: 15, color: '#6A737C'}}>{deposit}</span></Statistic.Value>
                        <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>ethers</span></Statistic.Label>
                    </Statistic>
                </Table.Cell>
                <Table.Cell textAlign='left'>
                    <Grid.Row textAlign='left'>
                        <span style={{fontSize: 18, color: '#6A737C'}}><a>{this.props.names[i]}</a></span></Grid.Row>
                    <Grid.Row textAlign='right'>Duration: 2 hours</Grid.Row>
                </Table.Cell> 
            </Table.Row>
            </Table.Body>
            </Table>
        });

        return <Responsive getWidth={getWidthFactory(this.props.isMobileFromSSR)} 
                            maxWidth={Responsive.onlyMobile.maxWidth} stackable doubling>
                            {items}
                </Responsive>;
    }

    render() {
        const itemsLength = this.props.availableRents? this.props.availableRents.length : 0;

        return(
            <Layout>
                <h3>Questions</h3>
                <Divider hidden/>

                {this.renderRentsDesktop()}
                {this.renderRentsMobile()}

                <Divider hidden/>
                <div style={{ marginTop: 20 }}>Found {itemsLength} Item(s).</div>
                <Divider hidden/>
            </Layout>
        );
    }
}

export default RentalIndex;
