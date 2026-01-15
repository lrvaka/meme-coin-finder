'use client';

import { useState } from 'react';
import { useWatchedWallets, KNOWN_WALLETS } from '@/lib/hooks/useWallets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { shortenAddress, copyToClipboard } from '@/lib/utils/format';
import { Plus, Trash2, Copy, ExternalLink, Wallet, Star, Eye } from 'lucide-react';
import type { WatchedWallet } from '@/types/token';

export default function WalletsPage() {
  const { wallets, addWallet, removeWallet, isLoaded } = useWatchedWallets();
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddWallet = () => {
    if (newAddress.trim() && newLabel.trim()) {
      const success = addWallet(newAddress.trim(), newLabel.trim());
      if (success) {
        setNewAddress('');
        setNewLabel('');
        setDialogOpen(false);
      }
    }
  };

  const handleAddKnownWallet = (wallet: WatchedWallet) => {
    addWallet(wallet.address, wallet.label);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Money Tracker</h1>
          <p className="text-muted-foreground mt-1">
            Track successful wallets and follow their trades
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Wallet to Watch</DialogTitle>
              <DialogDescription>
                Enter a Solana wallet address to track its transactions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Wallet Address
                </label>
                <Input
                  id="address"
                  placeholder="Enter Solana wallet address..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="label" className="text-sm font-medium">
                  Label
                </label>
                <Input
                  id="label"
                  placeholder="e.g., Whale #1, Influencer XYZ..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddWallet}>Add Wallet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my-wallets">
        <TabsList>
          <TabsTrigger value="my-wallets" className="gap-2">
            <Eye className="h-4 w-4" />
            My Watchlist ({wallets.length})
          </TabsTrigger>
          <TabsTrigger value="known-wallets" className="gap-2">
            <Star className="h-4 w-4" />
            Known Wallets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-wallets" className="mt-6">
          {!isLoaded ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ) : wallets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No wallets in watchlist</h3>
                <p className="text-muted-foreground mb-4">
                  Add wallets to track their trades and get insights
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Wallet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((wallet) => (
                    <WalletRow
                      key={wallet.address}
                      wallet={wallet}
                      onRemove={() => removeWallet(wallet.address)}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="known-wallets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Known Smart Money Wallets</CardTitle>
              <CardDescription>
                Curated list of successful traders and protocols
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {KNOWN_WALLETS.map((wallet) => {
                  const isWatched = wallets.some((w) => w.address === wallet.address);
                  return (
                    <Card key={wallet.address}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{wallet.label}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-xs text-muted-foreground">
                                {shortenAddress(wallet.address, 6)}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => copyToClipboard(wallet.address)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <Button
                            variant={isWatched ? 'secondary' : 'default'}
                            size="sm"
                            disabled={isWatched}
                            onClick={() => handleAddKnownWallet(wallet)}
                          >
                            {isWatched ? 'Watching' : 'Watch'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity Section */}
      {wallets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest transactions from your watched wallets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Transaction tracking requires a Helius API key.</p>
              <p className="text-sm mt-1">
                Add your key in <code className="bg-muted px-1 rounded">.env.local</code> to enable
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WalletRow({
  wallet,
  onRemove,
}: {
  wallet: WatchedWallet;
  onRemove: () => void;
}) {
  const addedDate = new Date(wallet.addedAt).toLocaleDateString();

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{wallet.label}</Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <code className="text-sm">{shortenAddress(wallet.address, 8)}</code>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copyToClipboard(wallet.address)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{addedDate}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <a
            href={`https://solscan.io/account/${wallet.address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
